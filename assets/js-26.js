/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */
(function () {
	const siteNavigation = document.getElementById('site-navigation');

	// Return early if the navigation doesn't exist.
	if (!siteNavigation || siteNavigation.querySelector('.myio-mm')) {
		return;
	}

	const button = siteNavigation.getElementsByTagName('button')[0];

	// Return early if the button doesn't exist.
	if ('undefined' === typeof button) {
		return;
	}

	const menu = siteNavigation.getElementsByTagName('ul')[0];

	// Hide menu toggle button if menu is empty and return early.
	if ('undefined' === typeof menu) {
		button.style.display = 'none';
		return;
	}

	if (!menu.classList.contains('nav-menu')) {
		menu.classList.add('nav-menu');
	}

	// Toggle the .toggled class and the aria-expanded value each time the button is clicked.
	button.addEventListener('click', function () {
		siteNavigation.classList.toggle('toggled');

		if (button.getAttribute('aria-expanded') === 'true') {
			button.setAttribute('aria-expanded', 'false');
		} else {
			button.setAttribute('aria-expanded', 'true');
		}
	});

	// Remove the .toggled class and set aria-expanded to false when the user clicks outside the navigation.
	document.addEventListener('click', function (event) {
		const isClickInside = siteNavigation.contains(event.target);

		if (!isClickInside) {
			siteNavigation.classList.remove('toggled');
			button.setAttribute('aria-expanded', 'false');
		}
	});

	// Get all the link elements within the menu.
	const links = menu.getElementsByTagName('a');

	// Get all the link elements with children within the menu.
	const linksWithChildren = menu.querySelectorAll('.menu-item-has-children > a, .page_item_has_children > a');

	// Toggle focus each time a menu link is focused or blurred.
	for (const link of links) {
		link.addEventListener('focus', toggleFocus, true);
		link.addEventListener('blur', toggleFocus, true);
	}

	// Toggle focus each time a menu link with children receive a touch event.
	for (const link of linksWithChildren) {
		link.addEventListener('touchstart', toggleFocus, false);
	}

	/**
	 * Sets or removes .focus class on an element.
	 */
	function toggleFocus() {
		if (event.type === 'focus' || event.type === 'blur') {
			let self = this;
			// Move up through the ancestors of the current link until we hit .nav-menu.
			while (!self.classList.contains('nav-menu')) {
				// On li elements toggle the class .focus.
				if ('li' === self.tagName.toLowerCase()) {
					self.classList.toggle('focus');
				}
				self = self.parentNode;
			}
		}

		if (event.type === 'touchstart') {
			const menuItem = this.parentNode;
			event.preventDefault();
			for (const link of menuItem.parentNode.children) {
				if (menuItem !== link) {
					link.classList.remove('focus');
				}
			}
			menuItem.classList.toggle('focus');
		}
	}
}());


// Note: PDF/video/invitation popup handling (window.showProductGallery,
// gallery-popup delegation, share button) moved to the shared
// assets/js/media-popup/media-popup.js module — see that file for the
// current implementation (including backward-compatible aliases).
document.addEventListener('DOMContentLoaded', function () {
	const counterEls = document.querySelectorAll('.biodataCounter');
	let currentCount = Math.floor(Math.random() * (130 - 115 + 1)) + 115;
	function updateCounter() {
		const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
		currentCount = Math.max(110, currentCount + change); // minimum of 110
		counterEls.forEach(el => {
			el.textContent = currentCount;
		});
	}
	if (counterEls.length > 0) {
		setInterval(updateCounter, Math.floor(Math.random() * 4000) + 4000);
	}


	window.sendErrorNotification = (message, context = { type: 'fatal' }, extra = '') => {
		const stack = new Error().stack.split("\n");
		let callerInfo = '';
		if (stack.length >= 3) {
			const match = stack[2].match(/(https?:\/\/.*):(\d+):(\d+)/);
			if (match) {
				callerInfo = `file: ${match[1]}, line: ${match[2]}`;
			}
		}

		var errorData = new FormData();
		errorData.append('action', 'myi_dn_notify');
		errorData.append('message', message + (extra ? ' ' + extra : ''));
		errorData.append('context', JSON.stringify({ ...context, caller: callerInfo }));

		return fetch(mi_fe_ajax_object.ajax_url, {
			method: 'POST',
			body: errorData
		})
			.then(r => r.json())
			.then(json => {
				console.log('Response', json);
				return json;
			})
			.catch(err => console.error('Error:', err));
	};

});
