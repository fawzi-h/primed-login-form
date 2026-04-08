<script 
  async 
  defer 
  src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBKarV1RuwB6pztogRZVVhPGlXRZcnpm_o&loading=async&libraries=places">
</script>

<!-- <script src="https://fawzi-h.github.io/primed-login-form/login-form.js" defer></script> 
<script src="https://fawzi-h.github.io/primed-login-form/register-form-v-2.js" defer></script>-->

<!-- <script src="https://fawzi-h.github.io/primed-login-form/primed-auth-shared.js" defer></script>
<script src="https://fawzi-h.github.io/primed-login-form/primed-login-form.js" defer></script>
<script src="https://fawzi-h.github.io/primed-login-form/primed-signup-form.js" defer></script>-->

<!-- Add JS files based on domain -->
<script>
  (function() {
    var isPrimed = window.location.hostname === 'primedclinic.com.au' || 
                   window.location.hostname === 'www.primedclinic.com.au';
    var base = isPrimed
      ? 'https://fawzi-h.github.io/primed-login-form/'
      : 'https://qagencyau.github.io/primed-login-form/';

    var scripts = [
      'primed-auth-shared.js',
      'primed-login-form.js',
      'primed-signup-form.js'
    ];

    scripts.forEach(function(file) {
      var s = document.createElement('script');
      s.src = base + file;
      s.defer = true;
      document.head.appendChild(s);
    });
  })();
</script>


<script src="https://fawzi-h.github.io/primed-login-form/logout.js" defer></script>
<script src="https://fawzi-h.github.io/primed-login-form/auth.js" defer></script>
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css"/>

<!-- JS -->
<script src="https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.js"></script>

<script>
// update current year in footer credits ------------

$(function() {

  $('.this-year').text(new Date().getFullYear());

});

</script>


<!--<script async src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
<script async src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js"></script>-->
<script  src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script  src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script  src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>

