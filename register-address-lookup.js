(function () {
  "use strict";

  const LOOKUP_ID = "register-address";
  const DETAILS_WRAPPER_ID = "address-details-wrapper";

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };

  function injectStyles() {
    if (document.getElementById("primed-address-anim-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-address-anim-styles";
    style.textContent = `
      .addr-anim {
        overflow: hidden;
        transition: max-height 260ms ease, opacity 220ms ease;
        will-change: max-height, opacity;
      }
    `;
    document.head.appendChild(style);
  }

  function $(id) {
    return document.getElementById(id);
  }

  function clearAddressFields() {
    Object.values(FIELD_IDS).forEach(function (id) {
      const el = $(id);
      if (el) el.value = "";
    });
  }

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

  function showAnimated(el) {
    if (!el) return;

    el.classList.add("addr-anim");

    // Make it render (no gap before this because it was display:none)
    el.style.display = "block";
    el.style.opacity = "0";
    el.style.maxHeight = "0px";
    el.style.pointerEvents = "none";

    // Force reflow then animate open
    void el.offsetHeight;

    const target = el.scrollHeight;
    el.style.opacity = "1";
    el.style.maxHeight = target + "px";
    el.style.pointerEvents = "auto";

    // Remove height cap after animation so it adapts
    setTimeout(function () {
      el.style.maxHeight = "none";
    }, 320);
  }

  function hideAnimatedToNone(el) {
    if (!el) return;

    el.classList.add("addr-anim");

    // If maxHeight is none, set it to current height so we can animate down
    const h = el.scrollHeight;
    el.style.maxHeight = h + "px";
    el.style.opacity = "1";
    el.style.pointerEvents = "auto";

    void el.offsetHeight;

    el.style.maxHeight = "0px";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";

    // After transition ends, remove from layout completely (no gap)
    setTimeout(function () {
      el.style.display = "none";
    }, 300);
  }

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

  function bindIfReady() {
    const lookupInput = $(LOOKUP_ID);
    const wrapper = $(DETAILS_WRAPPER_ID);

    if (!lookupInput || !wrapper) return false;
    if (lookupInput.__primedBound) return true;

    lookupInput.__primedBound = true;

    // Ensure initial no-gap hidden state
    wrapper.style.display = "none";
    wrapper.style.opacity = "0";
    wrapper.style.maxHeight = "0px";
    wrapper.style.pointerEvents = "none";
    wrapper.classList.add("addr-anim");

    waitForPlaces(
      function () {
        const ac = new google.maps.places.Autocomplete(lookupInput, {
          types: ["address"],
          componentRestrictions: { country: "au" },
          fields: ["address_components", "formatted_address"],
        });

        ac.addListener("place_changed", function () {
          const place = ac.getPlace();
          if (!place || !place.address_components) return;

          if (place.formatted_address) lookupInput.value = place.formatted_address;

          populateAddress(place);
          showAnimated(wrapper);
        });

        lookupInput.addEventListener("input", function () {
          if (!lookupInput.value.trim()) {
            clearAddressFields();
            hideAnimatedToNone(wrapper);
          }
        });
      },
      function () {
        // If Google fails, just show fields (no animation needed)
        wrapper.style.display = "block";
        wrapper.style.opacity = "1";
        wrapper.style.maxHeight = "none";
        wrapper.style.pointerEvents = "auto";
      }
    );

    return true;
  }

  function startObserver() {
    if (bindIfReady()) return;

    const obs = new MutationObserver(function () {
      if (bindIfReady()) obs.disconnect();
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { obs.disconnect(); }, 20000);
  }

  function init() {
    injectStyles();
    startObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
