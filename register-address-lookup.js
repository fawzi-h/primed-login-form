(function () {
  "use strict";

  // --------------------
  // CONFIG: update these IDs if needed
  // --------------------
  const LOOKUP_ID = "address-lookup";

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };

  // Optional: wrappers you want to unhide after selection (set to null if not using)
  // Put these IDs on wrapper divs in Webflow.
  const ADDRESS_DETAILS_WRAPPER_ID = "address-details-wrapper"; // wrapper around street/suburb/state/postcode fields
  const CONTINUE_BUTTON_ID = null; // example: "register-submit" or a separate button id

  // --------------------
  // Inject minimal CSS (red highlight)
  // --------------------
  function injectStyles() {
    if (document.getElementById("primed-addr-styles")) return;
    const style = document.createElement("style");
    style.id = "primed-addr-styles";
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

  function showEl(el) {
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

  // --------------------
  // Parse Google address_components
  // --------------------
  function getComponent(place, type) {
    if (!place || !place.address_components) return null;
    for (const c of place.address_components) {
      if (c.types && c.types.indexOf(type) > -1) return c;
    }
    return null;
  }

  function fillAddressFromPlace(place) {
    // street number + route
    const streetNumber = getComponent(place, "street_number");
    const route = getComponent(place, "route");

    // suburb: Google can return "locality" OR "postal_town" OR "sublocality" depending on area
    const locality = getComponent(place, "locality") ||
      getComponent(place, "postal_town") ||
      getComponent(place, "sublocality") ||
      getComponent(place, "sublocality_level_1");

    // state
    const state = getComponent(place, "administrative_area_level_1");

    // postcode
    const postcode = getComponent(place, "postal_code");

    const streetNumberEl = $(FIELD_IDS.streetNumber);
    const streetNameEl = $(FIELD_IDS.streetName);
    const suburbEl = $(FIELD_IDS.suburb);
    const stateEl = $(FIELD_IDS.state);
    const postcodeEl = $(FIELD_IDS.postcode);

    // Clear previous errors
    [streetNumberEl, streetNameEl, suburbEl, stateEl, postcodeEl].forEach(clearError);

    // Fill values if present
    if (streetNumberEl) streetNumberEl.value = streetNumber ? streetNumber.long_name : "";
    if (streetNameEl) streetNameEl.value = route ? route.long_name : "";
    if (suburbEl) suburbEl.value = locality ? locality.long_name : "";
    if (stateEl) stateEl.value = state ? (state.short_name || state.long_name) : "";
    if (postcodeEl) postcodeEl.value = postcode ? postcode.long_name : "";

    // Lightweight completeness check
    let ok = true;
    if (!streetNumber) { ok = false; if (streetNumberEl) setError(streetNumberEl, "Street number missing. Please enter it."); }
    if (!route) { ok = false; if (streetNameEl) setError(streetNameEl, "Street name missing. Please enter it."); }
    if (!locality) { ok = false; if (suburbEl) setError(suburbEl, "Suburb missing. Please enter it."); }
    if (!state) { ok = false; if (stateEl) setError(stateEl, "State missing. Please enter it."); }
    if (!postcode) { ok = false; if (postcodeEl) setError(postcodeEl, "Postcode missing. Please enter it."); }

    // Unhide details + button after selection
    showEl($(ADDRESS_DETAILS_WRAPPER_ID));
    if (CONTINUE_BUTTON_ID) showEl($(CONTINUE_BUTTON_ID));

    return ok;
  }

  // --------------------
  // Init Places Autocomplete
  // --------------------
  function initAutocomplete() {
    const lookupInput = $(LOOKUP_ID);
    if (!lookupInput) return;

    if (!(window.google && google.maps && google.maps.places)) {
      // Google script not loaded or key blocked
      setError(lookupInput, "Address lookup is unavailable. Please enter address manually.");
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(lookupInput, {
      types: ["address"],
      componentRestrictions: { country: "au" }, // restrict to Australia :contentReference[oaicite:1]{index=1}
      fields: ["address_components", "formatted_address"],
    });

    autocomplete.addListener("place_changed", function () {
      const place = autocomplete.getPlace();

      if (!place || !place.address_components) {
        setError(lookupInput, "Please select an address from the list.");
        return;
      }

      clearError(lookupInput);

      // Optionally set the lookup input to the formatted address
      if (place.formatted_address) lookupInput.value = place.formatted_address;

      fillAddressFromPlace(place);
    });

    // If user types but does not pick from dropdown
    lookupInput.addEventListener("blur", function () {
      // If they blurred without selection, do nothing. Submit validation should catch missing fields.
    });
  }

  // --------------------
  // Boot
  // --------------------
  injectStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAutocomplete);
  } else {
    initAutocomplete();
  }
})();
