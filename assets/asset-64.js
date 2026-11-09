( function () {
	'use strict';

	var backBtn = document.querySelector( '.back-template' );
	if ( ! backBtn ) {
		return;
	}

	// Auto-hide on scroll-down (exits back out the top of the viewport),
	// reappears on scroll-up — direction is compared against the last
	// scroll position, not just "near the top", so it also re-appears
	// mid-page the moment the visitor scrolls back up even slightly.
	var lastScrollY = window.scrollY;
	var ticking = false;

	function onScroll() {
		var currentScrollY = window.scrollY;

		if ( currentScrollY > lastScrollY && currentScrollY > 40 ) {
			backBtn.classList.add( 'is-hidden' );
		} else if ( currentScrollY < lastScrollY ) {
			backBtn.classList.remove( 'is-hidden' );
		}

		lastScrollY = currentScrollY;
		ticking = false;
	}

	window.addEventListener( 'scroll', function () {
		if ( ! ticking ) {
			window.requestAnimationFrame( onScroll );
			ticking = true;
		}
	}, { passive: true } );
} )();
