///////////////////////////////////////////////////////////////////////
///////////////////////// Dimensions & Scales /////////////////////////
///////////////////////////////////////////////////////////////////////

const pageWidth = 680,
    pageHeight = 1800,
    padding = 40;
const radiusOrg = 140;

let svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", pageWidth)
    .attr("height", pageHeight);

const roles = {
    Analyst: 0,
    Designer: 1,
    Engineer: 2,
    Journalist: 3,
    Manager: 4,
    Other: 5,
};
const numOrgs = 10,
    numRoles = 6;
const startAngle = Math.PI / 8,
    endAngle = (4.5 * Math.PI) / 6;
const sides = { yoe: -1, salary: 1 };

let xOrgScale = (iOrg) => {
    return d3
        .scaleLinear()
        .domain([0, 1])
        .range([padding + radiusOrg, pageWidth - padding - radiusOrg])(
        iOrg % 2 === 0 ? 0 : 1
    );
};
let yOrgScale = (iOrg) => {
    return d3
        .scaleLinear()
        .domain([0, numOrgs])
        .range([padding + radiusOrg, pageHeight - padding - radiusOrg])(iOrg);
};

let ryRoleScale = (iRole) => {
    return d3
        .scaleLinear()
        .domain([numRoles - 1, 0])
        .range([0.32 * radiusOrg, 0.88 * radiusOrg])(iRole);
};

let rxScale = (side) => {
    // YOE or Salary
    return d3
        .scaleLinear()
        .domain([-1, side === "yoe" ? 38 : 270])
        .range([sides[side] * startAngle, sides[side] * endAngle]);
};
let ryScale = d3 // % Volume
    .scaleSqrt()
    .domain([0, 1])
    .range([0, 0.22 * radiusOrg]);

let barPadding = 2,
    barHeight = 0.4 * (ryRoleScale(1) - ryRoleScale(0));
let rxBarScale = d3
    .scaleLinear()
    .domain([0, 200]) // Change?
    .range([
        -endAngle - (barPadding / 180) * Math.PI,
        -2 * endAngle + (barPadding / 180) * Math.PI,
    ]);

let rToX = (r, angle) => r * Math.cos(angle - Math.PI / 2);
let rToY = (r, angle) => r * Math.sin(angle - Math.PI / 2);

///////////////////////////////////////////////////////////////////////
////////////////////////// Drawing Functions //////////////////////////
///////////////////////////////////////////////////////////////////////

createOrgs = (data) => {
    // Set placement for org groups
    let gOrg = svg
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("class", (d) => `org ${d.org}`)
        .attr(
            "transform",
            (d, i) => `translate(${xOrgScale(i)}, ${yOrgScale(i)})`
        );
    return gOrg;
};

createRoles = (gOrg) => {
    // Create grid group
    gGrid = gOrg.append("g").classed("grid", true);
    // Create subgroup for each role
    gRole = gGrid
        .selectAll("g")
        .data((d) => d.roles)
        .enter()
        .append("g")
        .attr("class", (d) => `role ${d.role}`);
    return gRole;
};

drawMetrics = (gRole) => {
    Object.keys(sides).forEach((side) => {
        // Split between 2 area charts
        gPrimary = gRole
            .selectAll(`g.${side}`)
            .data((d) => d.primaries)
            .enter()
            .append("g")
            .classed(side, true);

        // Draw area charts
        gPrimary
            .append("path")
            .attr("class", (d) => `centrality primary-${d.primary}`)
            .attr("d", (d) => {
                let areaData = d[`${side}Metrics`];
                if (side === "yoe") {
                    areaData[areaData.length] = {
                        yoe: -1,
                        role: d.role,
                        yoePctVolume: 0,
                    };
                    areaData[areaData.length] = {
                        yoe: 38,
                        role: d.role,
                        yoePctVolume: 0,
                    };
                } else {
                    areaData[areaData.length] = {
                        salary: -1,
                        role: d.role,
                        salaryPctVolume: 0,
                    };
                    areaData[areaData.length] = {
                        salary: 270,
                        role: d.role,
                        salaryPctVolume: 0,
                    };
                }
                areaData = areaData.sort((a, b) =>
                    d3.ascending(a[side], b[side])
                );
                return d3
                    .radialArea()
                    .curve(d3.curveCatmullRom.alpha(0))
                    .angle((d) => rxScale(side)(d[side]))
                    .innerRadius((d) => ryRoleScale(roles[d.role]))
                    .outerRadius(
                        (d) =>
                            ryRoleScale(roles[d.role]) +
                            ryScale(d[`${side}PctVolume`])
                    )(areaData);
            });

        /////////////////////////////////////////////////////

        // Draw grid line
        gRole
            .append("path")
            .classed("gridline", true)
            .attr("d", (d, i) =>
                d3
                    .arc()
                    .startAngle(sides[side] * startAngle)
                    .endAngle(sides[side] * endAngle)
                    .innerRadius(ryRoleScale(i))
                    .outerRadius(ryRoleScale(i) + 0.2)()
            );
    });
    // Clean up curve lines that appear under the y axis
    gPrimary
        .append("circle")
        .attr("r", (d) => ryRoleScale(d.iRole) - 0.2)
        .attr("class", (d) => `cleanup ${d.role}`);
};

// drawGridLines = (gOrg) => {};

drawTitles = (gOrg, gRole) => {
    // Draw Org title
    gOrg.append("text")
        .classed("text", true)
        .classed("org-text", true)
        .text((d) => d.org.toUpperCase());
    // Draw Role title
    gTitle = gRole.append("g").classed("title", true);
    gTitle
        .append("path")
        .classed("title-path", true)
        .classed("hidden", true)
        .attr("d", (d) => {
            return [
                `M${rToX(ryRoleScale(d.iRole), -startAngle)} ${rToY(
                    ryRoleScale(d.iRole),
                    -startAngle
                )}`,
                `A${ryRoleScale(d.iRole)} ${ryRoleScale(d.iRole)}`,
                "0 0 1",
                `${rToX(ryRoleScale(d.iRole), startAngle)}`,
                `${rToY(ryRoleScale(d.iRole), startAngle)}`,
            ].join(" ");
        })
        .attr("id", (d) => `title-path-${d.role}-${d.org}`);
    gTitle
        .append("text")
        .classed("text", true)
        .append("textPath")
        .attr("xlink:href", (d) => `#title-path-${d.role}-${d.org}`)
        .attr("startOffset", "50%")
        .text((d) => d.role);
};

drawBar = (gRole) => {
    gBar = gRole.append("g").classed("bar", true);
    // Primary
    gBar.append("g")
        .selectAll("path")
        .data((d) => d.agg)
        .enter()
        .append("path")
        .attr("class", (d) => `primary ${d.role}`)
        .attr("d", (d) =>
            d3
                .arc()
                .innerRadius(ryRoleScale(d.iRole) + barHeight / 2)
                .outerRadius(ryRoleScale(d.iRole) - barHeight / 2)
                .startAngle(rxBarScale(0))
                .endAngle(rxBarScale(d.primary))()
        );
    // Secondary
    gBar.append("g")
        .selectAll("path")
        .data((d) => d.agg)
        .enter()
        .append("path")
        .attr("class", (d) => `secondary ${d.role}`)
        .attr("d", (d) =>
            d3
                .arc()
                .innerRadius(ryRoleScale(d.iRole) + barHeight / 2)
                .outerRadius(ryRoleScale(d.iRole) - barHeight / 2)
                .startAngle(rxBarScale(d.primary))
                .endAngle(rxBarScale(d.secondary))()
        );
    // Total
    gBar.append("g")
        .classed("total", true)
        .selectAll("text")
        .data((d) => d.agg)
        .enter()
        .append("text")
        .classed("total", true)
        .classed("text", true)
        .text((d) => d.total)
        .attr("y", d => ryRoleScale(d.iRole)-5)
        .attr("transform", d => `rotate(${rxBarScale(d.secondary) / Math.PI * 180 - 180 - 3})`)
        // .attr("x", (d) => rToX(ryRoleScale(d.iRole), rxBarScale(d.total)))
        // .attr("y", (d) => rToY(ryRoleScale(d.iRole), rxBarScale(d.total)));
};

///////////////////////////////////////////////////////////////////////
//////////////////////////////// Data /////////////////////////////////
///////////////////////////////////////////////////////////////////////

d3.json("data/metrics.json").then((data) => {
    console.log(data);
    gOrg = createOrgs(data);
    gRole = createRoles(gOrg);
    drawMetrics(gRole);
    drawTitles(gOrg, gRole);
    drawBar(gRole);
});
