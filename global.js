// Global variables to hold parsed CSV data
let tempData = {};
let actData = {};

// Create a tooltip using D3 (appended to the body)
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Load all CSV files concurrently using D3
Promise.all([
  d3.csv("AvgFemTempEst.csv"),
  d3.csv("AvgFemTempNonEst.csv"),
  d3.csv("AvgMaleTemp.csv"),
  d3.csv("AvgFemActEst.csv"),
  d3.csv("AvgFemActNonEst.csv"),
  d3.csv("AvgMaleAct.csv")
])
  .then(function(files) {
    // Process Temperature CSVs
    tempData.femEst = files[0].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    tempData.femNonEst = files[1].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    tempData.male = files[2].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    
    // Process Activity CSVs
    actData.femEst = files[3].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    actData.femNonEst = files[4].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    actData.male = files[5].map(function(d) {
      return { hour: +d.hour, avg_value: +d.avg_value };
    });
    
    // Render the Temperature chart by default
    renderTemperatureChart();
  })
  .catch(function(error) {
    console.error("Error loading CSV files:", error);
  });


/**
 * Renders the Temperature Chart with three lines and a legend.
 */
function renderTemperatureChart() {
  // Clear any existing chart content
  d3.select("#chart").selectAll("*").remove();

  // Define dimensions and margins
  const margin = { top: 50, right: 30, bottom: 50, left: 60 },
        width  = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Append SVG to the chart container
  const svg = d3.select("#chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x-scale (hours 0 to 24)
  const xScale = d3.scaleLinear()
    .domain([0, 24])
    .range([0, width]);

  // Determine y-scale from the overall extent of temperature values
  const allY = [].concat(
    tempData.femEst.map(d => d.avg_value),
    tempData.femNonEst.map(d => d.avg_value),
    tempData.male.map(d => d.avg_value)
  );
  const yExtent = d3.extent(allY);
  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - 1, yExtent[1] + 1])
    .range([height, 0]);

  // Add x-axis and y-axis
  svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(xScale));
  svg.append("g")
     .call(d3.axisLeft(yScale));

  // Define a line generator
  const line = d3.line()
    .x(function(d) { return xScale(d.hour); })
    .y(function(d) { return yScale(d.avg_value); });

  // Dataset configurations for temperature
  const datasets = [
    { name: "Female (Estrus)", data: tempData.femEst, color: "red" },
    { name: "Female (Non-Estrus)", data: tempData.femNonEst, color: "blue" },
    { name: "Male", data: tempData.male, color: "green" }
  ];

  // For each dataset, add a group with its path and circles
  datasets.forEach(function(ds) {
    const group = svg.append("g").attr("class", ds.name.replace(/\s/g, ""));

    // Draw the line path
    group.append("path")
      .datum(ds.data)
      .attr("fill", "none")
      .attr("stroke", ds.color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Draw circles at data points and add hover interactions
    group.selectAll("circle")
      .data(ds.data)
      .enter()
      .append("circle")
      .attr("cx", function(d) { return xScale(d.hour); })
      .attr("cy", function(d) { return yScale(d.avg_value); })
      .attr("r", 4)
      .attr("fill", ds.color)
      .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
          tooltip.html("<strong>" + ds.name + "</strong><br>Hour: " + d.hour + "<br>Value: " + d.avg_value.toFixed(2))
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
      });
  });

  // Add legend in the upper right corner
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 150) + ",0)");

  legend.selectAll("rect")
    .data(datasets)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i) { return i * 20; })
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", function(d) { return d.color; });

  legend.selectAll("text")
    .data(datasets)
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", function(d, i) { return i * 20 + 9; })
    .text(function(d) { return d.name; })
    .attr("font-size", "12px")
    .attr("fill", "#000");

  // Add chart title and axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Average Temperature Throughout the Day");
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Hour of the Day");
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .text("Temperature (°C)");
}


/**
 * Renders the Activity Chart with three lines and a legend.
 */
function renderActivityChart() {
  // Clear any existing chart content
  d3.select("#chart").selectAll("*").remove();

  // Define dimensions and margins
  const margin = { top: 50, right: 30, bottom: 50, left: 60 },
        width  = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  // Append SVG to the chart container
  const svg = d3.select("#chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Define the x-scale (hours 0 to 24)
  const xScale = d3.scaleLinear()
    .domain([0, 24])
    .range([0, width]);

  // Determine y-scale from the overall extent of activity values
  const allY = [].concat(
    actData.femEst.map(d => d.avg_value),
    actData.femNonEst.map(d => d.avg_value),
    actData.male.map(d => d.avg_value)
  );
  const yExtent = d3.extent(allY);
  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - 1, yExtent[1] + 1])
    .range([height, 0]);

  // Add x-axis and y-axis
  svg.append("g")
     .attr("transform", "translate(0," + height + ")")
     .call(d3.axisBottom(xScale));
  svg.append("g")
     .call(d3.axisLeft(yScale));

  // Define a line generator
  const line = d3.line()
    .x(function(d) { return xScale(d.hour); })
    .y(function(d) { return yScale(d.avg_value); });

  // Dataset configurations for activity
  const datasets = [
    { name: "Female (Estrus)", data: actData.femEst, color: "red" },
    { name: "Female (Non-Estrus)", data: actData.femNonEst, color: "blue" },
    { name: "Male", data: actData.male, color: "green" }
  ];

  // For each dataset, add a group with its path and circles
  datasets.forEach(function(ds) {
    const group = svg.append("g").attr("class", ds.name.replace(/\s/g, ""));

    // Draw the line path
    group.append("path")
      .datum(ds.data)
      .attr("fill", "none")
      .attr("stroke", ds.color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Draw circles at data points and add hover interactions
    group.selectAll("circle")
      .data(ds.data)
      .enter()
      .append("circle")
      .attr("cx", function(d) { return xScale(d.hour); })
      .attr("cy", function(d) { return yScale(d.avg_value); })
      .attr("r", 4)
      .attr("fill", ds.color)
      .on("mouseover", function(d) {
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
          tooltip.html("<strong>" + ds.name + "</strong><br>Hour: " + d.hour + "<br>Value: " + d.avg_value.toFixed(2))
            .style("left", (d3.event.pageX + 5) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
      });
  });

  // Add legend in the upper right corner
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(" + (width - 150) + ",0)");

  legend.selectAll("rect")
    .data(datasets)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d, i) { return i * 20; })
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", function(d) { return d.color; });

  legend.selectAll("text")
    .data(datasets)
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", function(d, i) { return i * 20 + 9; })
    .text(function(d) { return d.name; })
    .attr("font-size", "12px")
    .attr("fill", "#000");

  // Add chart title and axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Average Activity Throughout the Day");
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Hour of the Day");
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .text("Activity");
}


// Toggle button event listeners to switch between charts
document.getElementById("tempBtn").addEventListener("click", function() {
  renderTemperatureChart();
  setActiveButton("tempBtn");
});
document.getElementById("actBtn").addEventListener("click", function() {
  renderActivityChart();
  setActiveButton("actBtn");
});

// Utility function to update button active state
function setActiveButton(activeId) {
  d3.selectAll(".toggle-btn").classed("active", false);
  d3.select("#" + activeId).classed("active", true);
}
