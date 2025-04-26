
d3.csv("data/creditcard.csv").then(data => { data.forEach(d => {
    d.Amount = +d.Amount;
    d.Class = +d.Class;
    d.Time = +d.Time;
  });

  // ========== GRÁFICO 1: Barras Fraudes vs Legítimas ==========
  const counts = d3.rollup(data, v => v.length, d => d.Class);
  const chartData = Array.from(counts, ([key, value]) => ({
    label: key === 1 ? "Fraudes" : "Legítimas",
    value
  }));

  const width = 600;
  const height = 400;
  const margin = { top: 30, right: 20, bottom: 50, left: 60 };

  const svg = d3.select("#chart1")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.label))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.selectAll("rect")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.label))
    .attr("y", d => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", d => height - margin.bottom - y(d.value))
    .attr("fill", "#007BFF");

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Número de transacciones");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Tipo de transacción");

  const total = d3.sum(chartData, d => d.value);
  svg.selectAll("text.label")
    .data(chartData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.label) + x.bandwidth() / 2)
    .attr("y", d => y(d.value) - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#333")
    .text(d => `${((d.value / total) * 100).toFixed(2)}%`);

  // ========== GRÁFICO 2: Histograma SOLO de Fraudes ==========
  const frauds = data.filter(d => d.Class === 1);

  const amountExtent = [0, 2500];
  const binCount = 20;
  const binWidth = (amountExtent[1] - amountExtent[0]) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: amountExtent[0] + i * binWidth,
    x1: amountExtent[0] + (i + 1) * binWidth,
    count: 0
  }));

  frauds.forEach(d => {
    const idx = Math.floor((d.Amount - amountExtent[0]) / binWidth);
    if (idx >= 0 && idx < bins.length) {
      bins[idx].count++;
    }
  });

  const width2 = 700;
  const height2 = 400;
  const margin2 = { top: 50, right: 20, bottom: 80, left: 60 };

  const xScale = d3.scaleBand()
    .domain(bins.map((_, i) => i))
    .range([margin2.left, width2 - margin2.right])
    .padding(0.2);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.count)])
    .nice()
    .range([height2 - margin2.bottom, margin2.top]);

  const svg2 = d3.select("#chart2")
    .append("svg")
    .attr("width", width2)
    .attr("height", height2);

  svg2.append("g")
    .attr("transform", `translate(0,${height2 - margin2.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(i => {
      const bin = bins[i];
      return `$${Math.round(bin.x0)}–${Math.round(bin.x1)}`;
    }))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg2.append("g")
    .attr("transform", `translate(${margin2.left},0)`)
    .call(d3.axisLeft(yScale));

  svg2.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height2 / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Cantidad de fraudes");

  svg2.append("text")
    .attr("x", width2 / 2)
    .attr("y", height2 - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Rango del monto transaccionado ($)");

  svg2.selectAll(".bar-fraud")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar-fraud")
    .attr("x", (_, i) => xScale(i))
    .attr("y", d => yScale(d.count))
    .attr("width", xScale.bandwidth())
    .attr("height", d => yScale(0) - yScale(d.count))
    .attr("fill", "#dc3545")
    .attr("opacity", 0.7)
    .append("title")
    .text(d => `Fraudes: ${d.count}`);

  const legend = svg2.append("g").attr("transform", `translate(${width2 - 150}, ${margin2.top})`);
  legend.append("rect").attr("x", 0).attr("y", 0).attr("width", 15).attr("height", 15).attr("fill", "#dc3545");
  legend.append("text").attr("x", 20).attr("y", 12).text("Fraudes").style("font-size", "12px");

  // ========== GRÁFICO 3: Evolución temporal de fraudes ==========
  const interval = 1000;
  const maxTime = d3.max(frauds, d => d.Time);

  const timeBins = Array.from({ length: Math.ceil(maxTime / interval) }, (_, i) => ({
    time: i * interval,
    count: 0
  }));

  frauds.forEach(d => {
    const idx = Math.floor(d.Time / interval);
    if (idx < timeBins.length) timeBins[idx].count++;
  });

  const width3 = 800;
  const height3 = 400;
  const margin3 = { top: 50, right: 20, bottom: 50, left: 60 };

  const xTime = d3.scaleLinear()
    .domain([0, maxTime])
    .range([margin3.left, width3 - margin3.right]);

  const yTime = d3.scaleLinear()
    .domain([0, d3.max(timeBins, d => d.count)])
    .nice()
    .range([height3 - margin3.bottom, margin3.top]);

  const svg3 = d3.select("#chart3")
    .append("svg")
    .attr("width", width3)
    .attr("height", height3);

  svg3.append("g")
    .attr("transform", `translate(0,${height3 - margin3.bottom})`)
    .call(d3.axisBottom(xTime).ticks(10))
    .append("text")
    .attr("x", width3 / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Tiempo transcurrido (segundos)");

  svg3.append("g")
    .attr("transform", `translate(${margin3.left},0)`)
    .call(d3.axisLeft(yTime))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height3 / 2)
    .attr("y", -45)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Cantidad de fraudes");

  const line = d3.line()
    .x(d => xTime(d.time))
    .y(d => yTime(d.count));

  svg3.append("path")
    .datum(timeBins)
    .attr("fill", "none")
    .attr("stroke", "#dc3545")
    .attr("stroke-width", 2)
    .attr("d", line);

  svg3.selectAll(".dot")
    .data(timeBins)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => xTime(d.time))
    .attr("cy", d => yTime(d.count))
    .attr("r", 3)
    .attr("fill", "#dc3545")
    .append("title")
    .text(d => `Tiempo: ${d.time}s\\nFraudes: ${d.count}`);
});