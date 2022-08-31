console.log("Successfully loading the jQ3_Mac script");

const MARGIN = { LEFT: 100, RIGHT: 10, TOP: 10, BOTTOM: 100 };
const WIDTH = 1200 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 700 - MARGIN.TOP - MARGIN.BOTTOM;

var set_bounds = document.getElementById("cy");
// set_bounds.style.width = WIDTH.toString() + "px";
// set_bounds.style.height = HEIGHT.toString() + "px";
set_bounds.style.width = "85rem";
set_bounds.style.height = "35rem";

// var fileName = "data/jQ3_MacCytoscape/version_1/22.03.09_MacModel_v1.json";
// TODO NEEDS TO BE UPDATED FOR EACH NEW MODEL UPDATE
var directoryName = "data/jQ7_MacGMCSF/";
var fileName = "model.json";

// Initialize the cytoscape variable
var cy = cytoscape({
  container: document.getElementById("cy"), // container to render in
  style: [
    // the stylesheet for the graph
    {
      selector: "node",
      style: {
        // "background-color": "#666",
        "background-color": "data(color)",
        shape: "data(nodeShape)",
        label: "data(label)",
      },
    },

    {
      selector: "edge",
      style: {
        width: 3,
        // "line-color": "#ccc",
        "line-color": "data(color)",
        // "target-arrow-color": "#ccc",
        "target-arrow-color": "data(color)",
        // "target-arrow-shape": "triangle",
        "target-arrow-shape": "data(arrow)",
        "curve-style": "bezier",
      },
    },
  ],
  layout: {
    name: "preset",
    zoom: 0.45,
    pan: { x: 170, y: 60 },
  },

  // layout: {
  //   name: "grid",
  //   rows: 3,
  // },
});

// Load in the data
fetch(directoryName + fileName)
  .then((res) => res.json())
  .then((data) => (graphData = data))
  .then(() => {
    // console.log("The data is being loaded in!");
    // Add in the loaded json data
    cy.add(graphData);
    // update the styling (unnecessary?)
    // cy.style().update();
    // Adding in the hover tooltip
    addHover();
  });

function addHover() {
  cy.ready(function () {
    cy.elements().forEach(function (ele) {
      // see if the ele is a node or edge
      makePopper(ele);
    });
  });

  cy.elements().unbind("mouseover");
  cy.elements().bind("mouseover", (event) => event.target.tippy.show());

  cy.elements().unbind("mouseout");
  cy.elements().bind("mouseout", (event) => event.target.tippy.hide());
}

// Content of the hover tooltip
function makePopper(ele) {
  let ref = ele.popperRef(); // used only for positioning
  ele.tippy = tippy(ref, {
    // tippy options:
    content: () => {
      // See if the element is a node or edge
      if (ele._private.group == "nodes") {
        // Check which radio button is checked
        let content = document.createElement("div");
        let folder = pickScenario();
        let output_string = "<h3>" + ele._private.data.id + "</h3>";
        output_string +=
          '<p style="margin-bottom: 0; text-align: left"><strong>Positive Regs:</strong> ' +
          ele._private.data.positive +
          "</p>";
        output_string +=
          '<p style="text-align: left"><strong>Negative Regs:</strong> ' +
          ele._private.data.negative +
          "</p>";
        output_string += '<img src="';
        output_string += directoryName;
        // output_string += "plots/Scenario_0/";
        output_string += folder;
        output_string += ele._private.data.id;
        output_string += '.png" width = "300px" height="200px" alt="No Plot">';
        content.innerHTML = output_string;
        return content;
      } else {
        let content = document.createElement("div");
        // let output_string = "<h3>" + ele._private.data.id + "</h3>";
        let output_string =
          '<p style="margin-bottom: 0; text-align: left"><strong>Source:</strong> ' +
          ele._private.data.source +
          "</p>";
        output_string +=
          '<p style="margin-bottom: 0; text-align: left"><strong>Target:</strong> ' +
          ele._private.data.target +
          "</p>";

        content.innerHTML = output_string;
        return content;
      }
    },
    trigger: "manual", // probably want manual mode
  });
}

function download_txt() {
  var a = document.createElement("a");
  var file = new Blob([JSON.stringify(cy.nodes().jsons())], {
    type: "json",
  });
  a.href = URL.createObjectURL(file);
  a.download = "locations.json";
  a.click();
}

function pickScenario() {
  var folder = "Scenario_0/";
  if (document.getElementById("radio_0").checked) {
    folder = "Scenario_0/";
  } else if (document.getElementById("radio_1").checked) {
    folder = "Scenario_1/";
  } else if (document.getElementById("radio_2").checked) {
    folder = "Scenario_2/";
  } else if (document.getElementById("radio_3").checked) {
    folder = "Scenario_3/";
  } else if (document.getElementById("radio_4").checked) {
    folder = "Scenario_4/";
  } else if (document.getElementById("radio_5").checked) {
    folder = "Scenario_5/";
  } else if (document.getElementById("radio_6").checked) {
    folder = "Scenario_6/";
  } else if (document.getElementById("radio_7").checked) {
    folder = "Scenario_7/";
  } else if (document.getElementById("radio_8").checked) {
    folder = "Scenario_8/";
  }
  return folder;
}

// // Button listener to save node locations
// document.getElementById("saveLocation").addEventListener("click", download_txt);

// Button listener to reload figure
document.getElementById("reloadFigure").addEventListener("click", addHover);
