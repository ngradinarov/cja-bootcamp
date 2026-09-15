/*
  AJO Display Event Manager
  - Uses __alloyMonitors to capture propositions from network response
  - Matches to rendered selectors
  - Sends accurate display events
*/

(function () {
  var defined_selectors = [
    "#ajo-banner",
    "#ajo-pharmacy-banner",
    "#ajo-offer-doctor"
  ];

  var capturedPropositions = [];

  // Set up monitor BEFORE alloy loads — captures raw network responses
  window.__alloyMonitors = window.__alloyMonitors || [];
  window.__alloyMonitors.push({
    onNetworkResponse: function (data) {
      if (data.parsedBody && data.parsedBody.handle) {
        data.parsedBody.handle.forEach(function (h) {
          if (h.type === "personalization:decisions" && h.payload && h.payload.length) {
            h.payload.forEach(function (p) {
              capturedPropositions.push(p);
            });
            console.log(
              "%c[Personalization] Captured " + h.payload.length + " propositions from network response",
              "color: #9C27B0; font-weight: bold;"
            );
          }
        });
      }
    }
  });

  function checkAndSendDisplayEvents() {
    console.log(
      "%c[Personalization] Checking... captured: " + capturedPropositions.length,
      "color: #9C27B0; font-weight: bold;"
    );

    var renderedSelectors = [];

    defined_selectors.forEach(function (selector) {
      var el = document.querySelector(selector);
      if (el && el.innerHTML.trim().length > 0) {
        renderedSelectors.push(selector);
      }
    });

    if (renderedSelectors.length === 0) {
      console.log(
        "%c[Personalization] No rendered content on this page",
        "color: #F57C00; font-weight: bold;"
      );
      return;
    }

    console.log(
      "%c[Personalization] Rendered selectors:",
      "color: #2E7D32; font-weight: bold;",
      renderedSelectors
    );

    var matched = capturedPropositions.filter(function (p) {
      var items = p.items || [];
      return items.some(function (item) {
        var selector = item.data && item.data.selector;
        return selector && renderedSelectors.indexOf(selector) !== -1;
      });
    });

    if (matched.length === 0) {
      console.log(
        "%c[Personalization] No propositions match rendered selectors",
        "color: #F57C00; font-weight: bold;"
      );
      return;
    }

    var meta = matched.map(function (p) {
      return {
        id: p.id,
        scope: p.scope,
        scopeDetails: p.scopeDetails
      };
    });

    alloy("sendEvent", {
      xdm: {
        eventType: "decisioning.propositionDisplay",
        _experience: {
          decisioning: {
            propositionEventType: { display: 1 },
            propositions: meta
          }
        }
      }
    }).then(function () {
      console.log(
        "%c[Personalization] Display event sent for " + matched.length + " of " + capturedPropositions.length + " propositions",
        "color: #0078D4; font-weight: bold;",
        renderedSelectors
      );
    });
  }

  if (document.readyState === "complete") {
    setTimeout(checkAndSendDisplayEvents, 3000);
  } else {
    window.addEventListener("load", function () {
      setTimeout(checkAndSendDisplayEvents, 3000);
    });
  }
})();
