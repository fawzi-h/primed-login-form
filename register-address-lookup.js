(function () {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const LOOKUP_ID = "register-address";
  const DETAILS_WRAPPER_ID = "address-details-wrapper";

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };

  // Adjust to match your form spacing rhythm
  const VERTICAL_SPACING_PX = 16;

  // =========================
  // CSS injection (animation + spacing + optional errors)
  // =========================
  function injectStyles() {
    if (document.getElementById("primed-address-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-address-styles";
    style.textContent = `
      .addr-anim {
        overflow: hidden;
        transition: max-height 260ms ease, opacity 220ms ease;
        will-change: max-height, opacity;
      }

      /* Keep consistent spacing for the whole address block */
      #${DETAILS_WRAPPER_ID} {
        margin-top: ${VERTICAL_SPACING_PX}px;
        margin-bottom: ${VERTICAL_SPACING_PX}px;
      }

      /* Add spacing between rows inside wrapper */
      #${DETAILS_WRAPPER_ID} > .form_field-2col + .form_field-2col,
      #${DETAILS_WRAPPER_ID} > .form_field-wrapper + .form_field-wrapper,
      #${DETAILS_WRAPPER_ID} > .form_field-wrapper + .form_field-2col,
      #${DETAILS_WRAPPER_ID} > .form_field-2col + .form_field-wrapper {
        margin-top: ${VERTICAL_SPACING_PX}px;
      }

      /* Optional error styling */
      .is-invalid { border-color: #d93025 !important; }
      .field-error { color: #d93025; font-size: 0.875rem; margin-top: 6px; display: none; }
      .field-error.is-visible { display: block; }
    `;
    document.head.appendChild(style);
  }

  function $(id) {
    return document.getElementById(id);
  }

  // =========================
  // Inline style show/hide with animation
  // =========================
  function setCollapsedInline(el) {
    if (!el) return;
    el.classList.add("addr-anim");
    el.style.display = "block";
    el.style.maxHeight = "0px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  }

  function setExpandedInline(el) {
    if (!el) return;
    el.classList.add("addr-anim");
    el.style.display = "block";
    el.style.pointerEvents = "auto";

    const targetHeight = el.scrollHeight;
    el.style.maxHeight = targetHeight + "px";
    el.style.opacity = "1";

    window.setTimeout(function () {
      el.style.maxHeight = "none";
    }, 320);
  }

  function hideExpandedInline(el) {
    if (!el) return;

    el.classList.add("addr-anim");

    const currentHeight = el.scrollHeight;
    el.style.maxHeight = currentHeight + "px";
    el.style.opacity = "1";
    el.style.pointerEvents = "auto";

    void el.offsetHeight;

    el.style.maxHeight = "0px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  }

  // =========================
  // Google address parsing helpers
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

    if (streetNumberEl) streetNumberEl.value = streetNumberC ? streetNumberC.long_name : "";
    if (streetNameEl) streetNameEl.value = routeC ? routeC.long_name : "";
    if (suburbEl) suburbEl.value = suburbC ? suburbC.long_name : "";
    if (stateEl) stateEl.value = stateC ? (stateC.short_name || stateC.long_name) : "";
    if (postcodeEl) postcodeEl.value = postcodeC ? postcodeC.long_name : "";
  }

  function clearAddressFields() {
    Object.values(FIELD_IDS).forEach(function (id) {
      const el = $(id);
      if (el) el.value = "";
    });
  }

  // =========================
  // Wait for Google Places
  // =========================
  function waitForPlaces(onReady, onFail) {
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
        if (typeof onFail === "function") onFail();
        return;
      }

      setTimeout(tick, 200);
    })();
  }

  // =========================
  // Bind once when elements exist
  // =========================
  function bindIfReady() {
    const lookupInput = $(LOOKUP_ID);
    const detailsWrapper = $(DETAILS_WRAPPER_ID);

    if (!lookupInput || !detailsWrapper) return false;
    if (lookupInput.__primedAutocompleteBound) return true;

    lookupInput.__primedAutocompleteBound = true;

    // Always start hidden using inline CSS
    setCollapsedInline(detailsWrapper);

    waitForPlaces(
      function () {
        const autocomplete = new google.maps.places.Autocomplete(lookupInput, {
          types: ["address"],
          componentRestrictions: { country: "au" },
          fields: ["address_components", "formatted_address"],
        });

        autocomplete.addListener("place_changed", function () {
          const place = autocomplete.getPlace();
          if (!place || !place.address_components) return;

          if (place.formatted_address) lookupInput.value = place.formatted_address;

          populateAddress(place);
          setExpandedInline(detailsWrapper);
        });

        // Hide again if user deletes the lookup value
        lookupInput.addEventListener("input", function () {
          if (!lookupInput.value.trim()) {
            clearAddressFields();
            hideExpandedInline(detailsWrapper);
          }
        });
      },
      function () {
        // If Places does not load, show fields for manual entry
        setExpandedInline(detailsWrapper);
      }
    );

    return true;
  }

  // =========================
  // Observe DOM because Webflow can inject the register form later
  // =========================
  function startObserver() {
    // First attempt
    if (bindIfReady()) return;

    const obs = new MutationObserver(function () {
      if (bindIfReady()) obs.disconnect();
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    // Stop observing after 20s to avoid running forever
    setTimeout(function () {
      obs.disconnect();
    }, 20000);
  }

  // =========================
  // Boot
  // =========================
  injectStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
