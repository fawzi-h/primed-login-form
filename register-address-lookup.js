(function () {
  "use strict";

  // =========================
  // CONFIG (edit if needed)
  // =========================
  const LOOKUP_ID = "register-address";          // <-- your autocomplete input id
  const DETAILS_WRAPPER_ID = "address-details-wrapper"; // optional wrapper to unhide (set to null if not used)

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };

  // =========================
  // Inject CSS (red error + message)
  // =========================
  function injectStyles() {
    if (document.getElementById("primed-places-styles")) return;
    const style = document.createElement("style");
    style.id = "primed-places-styles";
    style.textContent = `
      .is-invalid { border-color: #d93025 !important; }
      .field-error { color: #d93025; font-size: .875rem; margin-top: 6px; display: none; }
      .field-error.is-visible { display: block; }
    `;
    document.head.appendChild(style);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function show(el) {
    if (!el) return;
    el.style.display = "";
  }

  function setError(input, message) {
    if (!input) return;
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const wrapper = input.closest(".form_field-wrapper") || input.parentElement;
    if (!wrapper) return;

    let err = wrapper.querySelector(".field-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      wrapper.appendChild(err);
    }
    err.textContent = message;
    err.classList.add("is-visible");
  }

  function clearError(input) {
    if (!input) return;
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    const wrapper = input.closest(".form_field-wrapper") || input.parentElement;
    if (!wrapper) return;

    const err = wrapper.querySelector(".field-error");
    if (err) err.classList.remove("is-visible");
  }

  // =========================
  // Parse Google address_components
  // =========================
  function getComponent(place, type) {
    if (!place || !place.address_components) return null;
    for (const c of place.address_components) {
      if (c.types && c.types.indexOf(type) > -1) return c;
    }
    return null;
  }

  function populateAddress(place) {
    const streetNumberC = getComponent(place, "street_number");
    const routeC = getComponent(place, "route");

    const suburbC =
      getComponent(place, "locality") ||
      getComponent(place, "postal_town") ||
      getComponent(place, "sublocality") ||
      getComponent(place, "sublocality_level_1");

    const stateC = getComponent(place, "administrative_area_level_1");
    const postcodeC = getComponent(place, "postal_code");

    const streetNumberEl = $(FIELD_IDS.streetNumber);
    const streetNameEl = $(FIELD_IDS.streetName);
    const suburbEl = $(FIELD_IDS.suburb);
    const stateEl = $(FIELD_IDS.state);
    const postcodeEl = $(FIELD_IDS.postcode);

    // Fill values
    if (streetNumberEl) streetNumberEl.value = streetNumberC ? streetNumberC.long_name : "";
    if (streetNameEl) streetNameEl.value = routeC ? routeC.long_name : "";
    if (suburbEl) suburbEl.value = suburbC ? suburbC.long_name : "";
    if (stateEl) stateEl.value = stateC ? (stateC.short_name || stateC.long_name) : "";
    if (postcodeEl) postcodeEl.value = postcodeC ? postcodeC.long_name : "";

    // Unhide details if you are hiding them initially
    if (DETAILS_WRAPPER_ID) show($(DETAILS_WRAPPER_ID));

    // Flag missing bits so user can complete manually
    if (streetNumberEl) streetNumberC ? clearError(streetNumberEl) : setError(streetNumberEl, "Street number missing. Please enter it.");
    if (streetNameEl) routeC ? clearError(streetNameEl) : setError(streetNameEl, "Street name missing. Please enter it.");
    if (suburbEl) suburbC ? clearError(suburbEl) : setError(suburbEl, "Suburb missing. Please enter it.");
    if (stateEl) stateC ? clearError(stateEl) : setError(stateEl, "State missing. Please enter it.");
    if (postcodeEl) postcodeC ? clearError(postcodeEl) : setError(postcodeEl, "Postcode missing. Please enter it.");
  }

  // =========================
  // Wait for Google Places to load
  // =========================
  function waitForPlaces(lookupInput, onReady) {
    const start = Date.now();
    const maxWaitMs = 15000;

    (function tick() {
      const ready =
        window.google &&
        google.maps &&
        google.maps.places &&
        typeof google.maps.places.Autocomplete === "function";

      if (ready) return onReady();

      if (Date.now() - start > maxWaitMs) {
        setError(lookupInput, "Address lookup is unavailable. Please enter your address manually.");
        return;
      }

      setTimeout(tick, 200);
    })();
  }

  function init() {
    injectStyles();

    const lookupInput = $(LOOKUP_ID);
    if (!lookupInput) return;

    waitForPlaces(lookupInput, function () {
      const autocomplete = new google.maps.places.Autocomplete(lookupInput, {
        types: ["address"],
        componentRestrictions: { country: "au" },
        fields: ["address_components", "formatted_address"],
      });

      autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();

        if (!place || !place.address_components) {
          setError(lookupInput, "Please select an address from the suggestions.");
          return;
        }

        clearError(lookupInput);

        if (place.formatted_address) {
          lookupInput.value = place.formatted_address;
        }

        populateAddress(place);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
