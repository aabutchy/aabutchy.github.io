// Interactive viewer for the simplified macrophage GM-CSF model (version 3).
// Renders data/macrophage-model/model.json with Cytoscape.js and shows a
// tooltip with each element's regulators and simulated trace on hover.

(function () {
  "use strict";

  const DATA_DIR = "../data/macrophage-model/";
  const container = document.getElementById("cy");

  const cy = cytoscape({
    container: container,
    style: [
      {
        selector: "node",
        style: {
          "background-color": "data(color)",
          shape: "data(nodeShape)",
          label: "data(label)",
          "font-family": "Inter, system-ui, sans-serif",
          "font-size": 18,
          "min-zoomed-font-size": 6,
          "text-valign": "center",
          "text-halign": "center",
          color: "#111",
          "text-outline-color": "#fff",
          "text-outline-width": 2,
        },
      },
      {
        selector: "edge",
        style: {
          width: 3,
          "line-color": "data(color)",
          "target-arrow-color": "data(color)",
          "target-arrow-shape": "data(arrow)",
          "curve-style": "bezier",
        },
      },
      {
        selector: ":active, .hover",
        style: {
          "overlay-opacity": 0.08,
        },
      },
    ],
    layout: { name: "preset" },
  });
  window.macrophageModel = cy; // exposed for debugging in the console

  function selectedScenario() {
    const checked = document.querySelector('input[name="scenario"]:checked');
    return (checked ? checked.value : "Scenario_0") + "/";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatList(csv) {
    if (!csv) return "<em>none</em>";
    return escapeHtml(String(csv).split(",").filter(Boolean).join(", "));
  }

  function tooltipContent(ele) {
    const d = ele.data();
    if (ele.isNode()) {
      const src = DATA_DIR + selectedScenario() + encodeURIComponent(d.id) + ".png";
      return (
        '<div style="max-width:320px">' +
        '<h3 style="margin:0 0 .4rem;font-size:1rem">' + escapeHtml(d.id) + "</h3>" +
        '<p style="margin:0;text-align:left"><strong>Positive regulators:</strong> ' + formatList(d.positive) + "</p>" +
        '<p style="margin:0 0 .5rem;text-align:left"><strong>Negative regulators:</strong> ' + formatList(d.negative) + "</p>" +
        '<img src="' + src + '" width="300" height="200" alt="Simulation trace for ' + escapeHtml(d.id) + '" style="display:block;background:#fff;border-radius:4px">' +
        "</div>"
      );
    }
    return (
      '<p style="margin:0;text-align:left"><strong>Source:</strong> ' + escapeHtml(d.source) + "</p>" +
      '<p style="margin:0;text-align:left"><strong>Target:</strong> ' + escapeHtml(d.target) + "</p>"
    );
  }

  function attachTooltip(ele) {
    const ref = ele.popperRef();
    ele.scratch("tip", tippy(ref, {
      content: "",
      trigger: "manual",
      arrow: true,
      placement: "top",
      maxWidth: 360,
      onShow: function (instance) {
        // Rebuilt on every show so the trace matches the selected scenario.
        instance.setContent(tooltipContent(ele));
      },
    }));
  }

  function showTip(ele) {
    const tip = ele.scratch("tip");
    if (tip) tip.show();
  }

  function hideTip(ele) {
    const tip = ele.scratch("tip");
    if (tip) tip.hide();
  }

  function hideAllTips() {
    cy.elements().forEach(hideTip);
  }

  fetch(DATA_DIR + "model.json")
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (elements) {
      cy.add(elements);
      cy.fit(undefined, 30);
      cy.elements().forEach(attachTooltip);
    })
    .catch(function (err) {
      container.innerHTML =
        '<p style="padding:1rem;color:#b42b3a">Could not load the model data (' + escapeHtml(err.message) + ").</p>";
    });

  cy.on("mouseover", "node, edge", function (evt) {
    showTip(evt.target);
  });
  cy.on("mouseout", "node, edge", function (evt) {
    hideTip(evt.target);
  });
  // Touch devices: tap toggles a tooltip; tapping the background clears them.
  cy.on("tap", "node, edge", function (evt) {
    hideAllTips();
    showTip(evt.target);
  });
  cy.on("tap", function (evt) {
    if (evt.target === cy) hideAllTips();
  });
  cy.on("pan zoom drag", hideAllTips);

  window.addEventListener("resize", function () {
    cy.resize();
  });
})();
