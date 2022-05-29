const WIDTH = document.getElementsByClassName("svg-container")[0].clientWidth,
      HEIGHT = WIDTH * 0.6;

const margin = { top: 80, bottom: 70, left: 100, right: 50 };

const width = WIDTH - margin.left - margin.right,
      height = HEIGHT - margin.top - margin.bottom;

const svg = d3.select("svg#bubblechart")
                    .attr("width", WIDTH)
                    .attr("height", HEIGHT);

const g = svg.append("g")
                    .attr("id", "bubble-container")
                    .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xAxis = svg.append("g")
                    .attr('transform', `translate(${margin.left}, ${margin.top + height})`)

const yAxis = svg.append("g")
                    .attr('transform', `translate(${margin.left}, ${margin.top})`)

const xLabel = svg.append("text")
                    .attr('transform', `translate(${margin.left + width / 2}, ${HEIGHT - margin.bottom / 2})`)
                    .attr('dy', '0.5em')
                    .style('text-anchor', 'middle');

const yLabel = svg.append("text")
                    .attr('transform', `rotate(-90) translate(${-(margin.top  + height / 2)}, ${margin.left / 2})`)
                    .style('text-anchor', 'middle');

const title = svg.append("text")
                    .attr('transform', `translate(${margin.left + width / 2}, ${margin.top / 2})`)
                    .attr('dy', '0.5em')
                    .style('text-anchor', 'middle');;

const svgTooltip = g.append("g")
                        .attr("display", "none");

svgTooltip.append("rect")
            .attr("width", 110)
            .attr("height", 60)
            .attr("fill", "lightgray")
            .attr("rx", 5)

const svgTooltipText = svgTooltip.append("text");

const idTooltip = svgTooltipText.append("tspan")
                    .attr("x", 10)
                    .attr("dy", "1.2em")
                    .attr("id", "id-value")

const xTooltip = svgTooltipText.append("tspan")
                    .attr("id", "x-value")
                    .attr("x", 10)
                    .attr("dy", "1.2em")

const yTooltip = svgTooltipText.append("tspan")
                    .attr("id", "y-value")
                    .attr("x", 10)
                    .attr("dy", "1.2em")



const xAxisDataSelect = document.querySelector("select#x-axis-data");
const yAxisDataSelect = document.querySelector("select#y-axis-data");

const xAxisScaleSelect = document.querySelector("select#x-axis-scale");
const yAxisScaleSelect = document.querySelector("select#y-axis-scale");

const loadSelections = (metadata) => {

    metadata.names.forEach((variable) => {
        const option = document.createElement("option");
        option.value = variable.key;
        option.innerHTML = variable.name;
        xAxisDataSelect.appendChild(option);
        yAxisDataSelect.appendChild(option.cloneNode(true));
    })

    xAxisDataSelect.value = metadata.names[0].key;
    yAxisDataSelect.value = metadata.names[1].key;

    metadata.scaleTypes.forEach((type) => {
        const option = document.createElement("option");
        option.value = type;
        option.innerHTML = type;
        xAxisScaleSelect.appendChild(option);
        yAxisScaleSelect.appendChild(option.cloneNode(true));
    })
    xAxisScaleSelect.value = metadata.scaleTypes[0]
    yAxisScaleSelect.value = metadata.scaleTypes[0]
}


// Mappeo hacia las escalas que vamos a usar

const scales = {
    "Date": d3.scaleTime,
    "Exponential": d3.scaleLog,
    "Linear": d3.scaleLinear
}

const join = (data) => {
    const xValue = xAxisDataSelect.value,
          yValue = yAxisDataSelect.value,
          xScaleType = xAxisScaleSelect.value,
          yScaleType = yAxisScaleSelect.value;

    const xName = xAxisDataSelect.options[xAxisDataSelect.selectedIndex].text,
          yName = yAxisDataSelect.options[yAxisDataSelect.selectedIndex].text;

    xLabel.text(xName)
    yLabel.text(yName)

    title.text(`${yName} (${yScaleType}) vs ${xName} (${xScaleType})`)

    let plotData = data.map((d) => {
        return {
            x: xScaleType === "Date" ? new Date(d[xValue]) : d[xValue],
            y: yScaleType === "Date" ? new Date(d[yValue]) : d[yValue],
            id: d.id,
        }
    })

    if (xScaleType === "Exponential") {
        plotData = plotData.filter((d) => d.x > 0)
    }

    if (yScaleType === "Exponential") {
        plotData = plotData.filter((d) => d.y > 0)
    }

    const xScale = scales[xScaleType]()
                    .domain(d3.extent(plotData.map((d) => d.x)))
                    .range([0, width])
                    .nice()

    const yScale = scales[yScaleType]()
                    .domain(d3.extent(plotData.map((d) => d.y)))
                    .range([height, 0])
                    .nice()

    const mouseOver = (_, d) => {
                        const posX = xScale(d.x),
                              posY = yScale(d.y);
                        xTooltip.text(`ID:  ${d.id}`)
                        yTooltip.text(`X :  ${d.x.toFixed(2)}`)
                        idTooltip.text(`Y :  ${d.y.toFixed(2)}`)
                        svgTooltip
                            .attr("transform", `translate(${posX + 10}, ${posY - 25})`)
                            .attr("display", "block")
                    }
    const mouseLeave = (_, d) => {
                        svgTooltip.attr("display", `none`)
                    }

    xAxis.transition().call(d3.axisBottom(xScale));
    yAxis.transition()
            .call(d3.axisLeft(yScale))
            .selectAll("line")
            .attr("x1", width)
            .attr("stroke-dasharray", "5")
            .attr("opacity", 0.5);

    g.selectAll("circle")
        .data(plotData)
        .join(
            (enter) => {
                enter.append("circle")
                        .attr("r", 0)
                        .attr("cx", (d) => xScale(d.x))
                        .attr("cy", (d) => yScale(d.y))
                        .on("mouseover", mouseOver)
                        .on("mouseleave", mouseLeave)
                        .style("fill", "purple")
                        .transition().duration(500)
                            .attr("r", 5)
                            .attr("opacity", 0.4)
            },
            (update) => {
                update.on("mouseover", mouseOver)
                      .on("mouseleave", mouseLeave)
                      .transition()
                        .style("fill", "steelblue")
                        .attr("cx", (d) => xScale(d.x))
                        .attr("cy", (d) => yScale(d.y))

            },
            (exit) => {
                exit.transition().duration(1000)
                        .style("fill", "red")
                        .attr("r", 0)
                        .remove()
            }
        )
}

d3.json("./src/dummy_data.json").then((rawData) => {
    const { data, metadata } = rawData;

    xAxisDataSelect.onchange = () => join(data);
    yAxisDataSelect.onchange = () => join(data);
    xAxisScaleSelect.onchange = () => join(data);
    yAxisScaleSelect.onchange = () => join(data);

    loadSelections(metadata);

    join(data);
})

