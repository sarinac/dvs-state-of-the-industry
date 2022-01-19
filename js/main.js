///////////////////////////////////////////////////////////////////////
///////////////////////// Dimensions & Scales /////////////////////////
///////////////////////////////////////////////////////////////////////

const pageWidth = 800,
    pageHeight = 1000,
    rolePadding = 40,
    pagePadding = 100;
const yRoleOffset = 300;
const radiusOrg = 140;

let svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", pageWidth)
    .attr("height", pageHeight);

const sides = { true: -1, false: 1 };

let xOrgScale = d3
    .scaleLinear()
    .domain([-1, 10.5])
    .range([pagePadding, pageWidth - pagePadding]);

let xRoleScale = d3
    .scaleLinear()
    .domain([-1, 5.5])
    .range([pagePadding, pageWidth - pagePadding]);
let rRoleScale = d3.scaleLinear().domain([0, 665]).range([28, 70]);
let yYoeScale = d3
    .scaleLinear()
    .domain([-1, 38])
    .range([yRoleOffset + pagePadding, pageHeight - pagePadding]);

let xCentralityScale = d3
    .scaleLinear()
    .domain([0, 0.25])
    .range([0, 0.5 * (xRoleScale(1) - xRoleScale(0))]);

let rToX = (r, angle) => r * Math.cos(angle - Math.PI / 2);
let rToY = (r, angle) => r * Math.sin(angle - Math.PI / 2);

const nodePadding = 10,
    nodeHeight = 15;

///////////////////////////////////////////////////////////////////////
////////////////////////// Drawing Functions //////////////////////////
///////////////////////////////////////////////////////////////////////
setGradient = () => {
    // Define the gradient
    let gGradient = svg.append("svg:defs");

    // Circle
    gradient = gGradient
        .append("svg:linearGradient")
        .attr("id", "gradient")
        .attr("x1", "50%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "100%");
    gradient
        .append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#d7b6d7")
        .attr("stop-opacity", 0.1);

    gradient
        .append("svg:stop")
        .attr("offset", "50%")
        .attr("stop-color", "#95a876")
        .attr("stop-opacity", 0.5);

    gradient
        .append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#95a876")
        .attr("stop-opacity", 0.8);

    // Primary
    gradientTrue = gGradient
        .append("svg:linearGradient")
        .attr("id", "gradient-True")
        .attr("x1", "100%")
        .attr("x2", "0%");
    gradientTrue
        .append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#f2de84")
        .attr("stop-opacity", 0.4);
    gradientTrue
        .append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#f2de84")
        .attr("stop-opacity", 0);
    // Secondary
    gradientTrue = gGradient
        .append("svg:linearGradient")
        .attr("id", "gradient-False")
        .attr("x1", "0%")
        .attr("x2", "100%");
    gradientTrue
        .append("svg:stop")
        .attr("offset", "0%")
        .attr("stop-color", "#dcc0ba")
        .attr("stop-opacity", 0.4);
    gradientTrue
        .append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "#dcc0ba")
        .attr("stop-opacity", 0);
};

createRoles = (data) => {
    // Set placement for role groups
    gRole = svg
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("class", (d) => `role ${d.role}`)
        .attr("transform", (d) => `translate(${xRoleScale(d.iRole)}, 0)`);

    // Draw role totals
    gRoleBackground = gRole
        .append("g")
        .attr("transform", `translate(0, ${pagePadding + yRoleOffset})`);
    gRoleBackground
        .append("circle")
        .classed("role-background", true)
        .attr("r", (d) => rRoleScale(d.roleTotal))
        .attr("fill", "url(#gradient)")
        .attr("stroke-width", 0);
    gRoleBackground
        .append("circle")
        .classed("role-background", true)
        .attr("r", (d) => rRoleScale(d.roleTotal))
        .attr("fill", "none");

    // Draw titles
    let titleRadius = 18,
        titleAngle = Math.PI / 2;
    gRoleTitle = gRole
        .append("g")
        .attr("transform", `translate(0, ${pagePadding + yRoleOffset})`)
        .classed("title", true);
    gRoleTitle
        .append("path")
        .classed("title-path", true)
        .classed("hidden", true)
        .attr("d", () => {
            return [
                `M${rToX(titleRadius, -titleAngle)} ${rToY(
                    titleRadius,
                    -titleAngle
                )}`,
                `A${titleRadius} ${titleRadius}`,
                "0 0 1",
                `${rToX(titleRadius, titleAngle)}`,
                `${rToY(titleRadius, titleAngle)}`,
            ].join(" ");
        })
        .attr("id", (d) => `title-path-${d.role}`);
    gRoleTitle
        .append("text")
        .classed("role-title", true)
        .append("textPath")
        .attr("xlink:href", (d) => `#title-path-${d.role}`)
        .attr("startOffset", "50%")
        .text((d) => d.role);

    return gRole;
};

setBackground = (gRole) => {
    gBackground = gRole.append("g").classed("background", true);

    // Split between 2 area charts
    gCentrality = gBackground
        .selectAll("g.centrality-background")
        .data((d) => d.primaries)
        .enter()
        .append("g")
        .classed("centrality-background", true);

    // Draw backgrounds
    gCentrality
        .append("rect")
        .attr("x", (d) =>
            d.primary.toLowerCase() === "true" ? -xCentralityScale(0.2) : 0
        )
        .attr("y", yYoeScale(-0.5))
        .attr("width", xCentralityScale(0.2))
        .attr("height", yYoeScale(37.5) - yYoeScale(0))
        .attr("fill", (d) => `url(#gradient-${d.primary})`);
};

drawGrid = (gRole) => {
    // Create group
    gGridline = gRole.append("g").classed("gridline", true);
    // Draw line
    gGridline
        .append("path")
        .attr("d", `M0, ${yYoeScale(-1) - 10} L0, ${yYoeScale(38) + 10}`)
        .attr("class", (d) => `gridline ${d.role}`);

    // Draw axis
    gGrid = svg.append("g").classed("grid", true);
    gGrid
        .append("g")
        .classed("axis", true)
        .selectAll("path")
        .data([5, 10, 15, 20, 25, 30, 35])
        .enter()
        .append("path")
        .classed("axis", true)
        .attr(
            "d",
            (d) =>
                `M${pagePadding}, ${yYoeScale(d)} L${
                    pageWidth - pagePadding + 20
                }, ${yYoeScale(d)}`
        );
    // Draw labels
    gGrid
        .append("g")
        .classed("text", true)
        .selectAll("text")
        .data([5, 10, 15, 20, 25, 30, 35])
        .enter()
        .append("text")
        .classed("axis-text", true)
        .attr("x", pagePadding)
        .attr("y", (d) => yYoeScale(d) - 2)
        .text((d) => `${d} years`);

    // Draw text for role totals
    gRoleTotal = gRole.append("g").classed("role-total", true);
    gRoleTotal
        .append("text")
        .attr("y", pagePadding + yRoleOffset - 3.5)
        .text((d) => d.roleTotal)
        .classed("role-total", true);
};

drawYoe = (gRole) => {
    // Create group
    gYoe = gRole.append("g").classed("yoe", true);

    // Split between 2 area charts
    gCentrality = gYoe
        .selectAll("g.centrality")
        .data((d) => d.primaries)
        .enter()
        .append("g")
        .classed("centrality", true);

    gCentrality
        .append("path")
        .attr("class", (d) => `centrality primary-${d.primary}`)
        .attr("d", (d) =>
            d3
                .area()
                .curve(d3.curveCatmullRom.alpha(0))
                .x0(0)
                .x1(
                    (d) =>
                        sides["" + d.primary] * xCentralityScale(d.yoePctVolume)
                )
                .y((d) => yYoeScale(d.yoe))(d.yoeMetrics)
        );
};

drawNodes = (data) => {
    let opacityScale = d3
        .scaleLinear()
        .domain([
            d3.min(
                data.filter((d) => d.level === 0),
                (d) => d.value
            ),
            d3.max(
                data.filter((d) => d.level === 0),
                (d) => d.value
            ),
        ])
        .range([0.1, 0.8]);

    gNodes = svg.append("g").classed("nodes", true);
    gNodes
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .filter((d) => d.level === 0)
        .attr(
            "x",
            (d) =>
                10.3 +
                xOrgScale(d.index) -
                0.5 *
                    (xOrgScale(d.index + 1) -
                        xOrgScale(d.index) +
                        0.5 * nodePadding)
        )
        .attr("y", 4.3 + pagePadding - nodeHeight / 2)
        .attr("height", 15)
        .attr("width", xOrgScale(1) - xOrgScale(0) - 0.5 * nodePadding)
        .attr("opacity", (d) => opacityScale(d.value))
        .classed("nodes", true);
    gNodes
        .append("g")
        .selectAll("rect")
        .data(data)
        .join("rect")
        .filter((d) => d.level === 0)
        .attr(
            "x",
            (d) =>
                xOrgScale(d.index) -
                0.5 * (xOrgScale(d.index + 1) - xOrgScale(d.index)) +
                0.5 * nodePadding
        )
        .attr("y", pagePadding - nodeHeight / 2)
        .attr("height", 15)
        .attr("width", xOrgScale(1) - xOrgScale(0) - 0.5 * nodePadding)
        .classed("nodes-outline", true);
    gNodes
        .append("g")
        .selectAll("text")
        .data(data)
        .join("text")
        .filter((d) => d.level === 0)
        .attr("x", (d) => xOrgScale(d.index))
        .attr("y", pagePadding + 1)
        .classed("nodes-outline-text", true)
        .text((d) => d.id);
};

drawLinks = (data) => {
    let opacityScale = d3
        .scaleLinear()
        .domain([d3.min(data, (d) => d.value), d3.max(data, (d) => d.value)])
        .range([0.05, 0.8]);
    let strokeWidthScale = d3
        .scaleLinear()
        .domain([d3.min(data, (d) => d.value), d3.max(data, (d) => d.value)])
        .range([0.5, 3]);
    let xRoleScale2 = d3.scaleLinear().domain([0, 5]).range([-12.2, 12.2]);
    let angleOrgScale = d3
        .scaleLinear()
        .domain([0, 9])
        .range([-Math.PI / 6, Math.PI / 6]);

    let yStart = pagePadding + nodeHeight / 2 + 8,
        height = pagePadding + yRoleOffset - nodeHeight / 2 - 3;
    gLinks = svg.append("g").classed("links", true);
    gLinks
        .append("g")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .classed("link", true)
        .attr("d", (d) => {
            let roleX = xRoleScale2(d.iRole);
            let orgX = rToX(rRoleScale(d.roleTotal), angleOrgScale(d.iOrg));
            let orgY = rToY(rRoleScale(d.roleTotal), angleOrgScale(d.iOrg));
            return [
                `M${xOrgScale(d.iOrg) + roleX}, ${yStart}`,
                `C${xOrgScale(d.iOrg) + roleX}, ${0.6 * height}`,
                `${xRoleScale(d.iRole) + orgX} ${0.6 * height + orgY}`,
                `${xRoleScale(d.iRole) + orgX} ${height + orgY}`,
            ].join(" ");
        })
        .attr("opacity", (d) => opacityScale(d.value))
        .style("stroke-width", (d) => strokeWidthScale(d.value));

    // Add circles
    gLinks
        .append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .classed("link-circle", true)
        .attr("r", 2)
        .attr("cx", (d) => xOrgScale(d.iOrg) + xRoleScale2(d.iRole))
        .attr("cy", yStart);
    gLinks
        .append("g")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .classed("link-circle", true)
        .attr("r", 2)
        .attr(
            "cx",
            (d) =>
                xRoleScale(d.iRole) +
                rToX(rRoleScale(d.roleTotal), angleOrgScale(d.iOrg))
        )
        .attr(
            "cy",
            (d) => height + rToY(rRoleScale(d.roleTotal), angleOrgScale(d.iOrg))
        );
};

drawLabels = () => {
    gLabels = svg.append("g").classed("labels", true);
    gLabels
        .append("g")
        .classed("axis-title", true)
        .attr(
            "transform",
            `translate(${pagePadding - 20}, ${
                yRoleOffset + pageHeight / 4 + 0.6 * pagePadding
            })`
        )
        .append("text")
        .classed("axis-title", true)
        .attr("transform", "rotate(-90)")
        .text("Years of Work Experience");
    gLabels
        .append("g")
        .classed("axis-title", true)
        .attr(
            "transform",
            `translate(${pagePadding - 20}, ${pagePadding + yRoleOffset})`
        )
        .append("text")
        .classed("axis-title", true)
        .attr("transform", "rotate(-90)")
        .text("Roles");
    gLabels
        .append("g")
        .classed("axis-title", true)
        .attr("transform", `translate(${pagePadding - 20}, ${pagePadding})`)
        .append("text")
        .classed("axis-title", true)
        .attr("transform", "rotate(-90)")
        .text("Orgs");
};
///////////////////////////////////////////////////////////////////////
//////////////////////////////// Data /////////////////////////////////
///////////////////////////////////////////////////////////////////////

d3.json("data/yoe.json").then((data) => {
    setGradient();
    gRole = createRoles(data);
    // setBackground(gRole);
    drawYoe(gRole);
    drawGrid(gRole);
});

d3.json("data/connect.json").then((data) => {
    drawLinks(data.links);
    drawNodes(data.nodes);
});

drawLabels();
