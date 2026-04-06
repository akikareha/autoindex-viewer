(function() {
	const grid = document.getElementById('grid');
	const crumbs = document.getElementById('crumbs');
	const status = document.getElementById('status');

	function showStatus(msg, isError = false) {
		status.textContent = msg || '';
		status.className = msg ? (isError ? '' : '') : 'hidden';
	}

	function normPath(p) {
		if (!p) return '/';
		try {
			p = decodeURIComponent(p);
		} catch (_) {}
		if (!p.startsWith('/')) p = '/' + p;
		if (!p.endsWith('/')) p += '/';
		return p;
	}

	function buildAbsURL(path) {
		return new URL(normPath(path), location.origin);
	}

	function setURL(path) {
		const qp = new URLSearchParams(location.search);
		qp.set('p', normPath(path));
		history.pushState({
			p: normPath(path)
		}, '', location.pathname + '?' + qp.toString());
	}

	function renderCrumbs(path) {
		crumbs.innerHTML = '';
		const parts = normPath(path).split('/').filter(Boolean);
		let acc = '/';
		const root = document.createElement('a');
		root.href = '#';
		root.textContent = '(root)';
		root.addEventListener('click', (e) => {
			e.preventDefault();
			navigate('/');
		});
		crumbs.appendChild(root);
		for (const part of parts) {
			const sep = document.createElement('span');
			sep.textContent = ' / ';
			sep.style.userSelect = 'none';
			crumbs.appendChild(sep);

			acc += part + '/';
			const currentPath = acc;

			const a = document.createElement('a');
			a.href = '#';
			a.textContent = part;

			a.addEventListener('click', (e) => {
				e.preventDefault();
				navigate(currentPath);
			});

			crumbs.appendChild(a);
		}
	}

	function safeDecode(s) {
		try {
			return decodeURIComponent(s);
		} catch (_) {
			return s;
		}
	}

	const modal = document.getElementById('modal');
	const modalImg = document.getElementById('modal-img');
	const modalVideo = document.getElementById('modal-video');
	const modalDir = document.getElementById('modal-dir');
	const modalURL = document.getElementById('modal-url');

	modalVideo.setAttribute('tabindex', '-1');
	modal.addEventListener('click', () => {
		document.body.focus();
	});

	let mediaList = [];
	let currentIndex = -1;

	function stopMedia() {
		modalVideo.pause();
		modalVideo.currentTime = 0;
	}

	function openModal(url, isVideo, isDir) {
		stopMedia();

		currentIndex = mediaList.findIndex(m => m.url === url);

		if (isDir) {
			modalImg.classList.add('hidden');
			modalVideo.classList.add('hidden');
			modalDir.classList.remove('hidden');

			modalURL.value = '[DIR] ' + location.origin + url;
		} else if (isVideo) {
			modalImg.classList.add('hidden');
			modalVideo.classList.remove('hidden');
			modalDir.classList.add('hidden');

			modalVideo.src = url;
			modalVideo.autoplay = true;
		} else {
			modalVideo.classList.add('hidden');
			modalImg.classList.remove('hidden');
			modalDir.classList.add('hidden');

			modalImg.src = url;
		}

		modalURL.value = location.origin + url;
		modal.classList.remove('hidden');
	}

	function closeModal() {
		stopMedia();
		modal.classList.add('hidden');
	}

	document.getElementById('close-btn').onclick = closeModal;

	document.getElementById('open-btn').onclick = () => {
		const src = modalVideo.classList.contains('hidden') ?
			modalImg.src :
			modalVideo.src;
		window.open(src, '_blank');
	};

	document.getElementById('copy-btn').onclick = () => {
		navigator.clipboard.writeText(modalURL.value).then(() => {
			alert('Copied!');
		});
	};

	modal.addEventListener('click', (e) => {
		if (e.target.classList.contains('content')) {
			closeModal();
		}
	});

	document.addEventListener('keydown', (e) => {
		if (modal.classList.contains('hidden')) return;

		if (['ArrowLeft', 'ArrowRight', 'Escape', 'Enter'].includes(e.key)) {
			e.preventDefault();
		}

		if (e.key === 'Escape') closeModal();

		if (e.key === 'ArrowRight') {
			currentIndex = (currentIndex + 1) % mediaList.length;
			openModal(
				mediaList[currentIndex].url,
				mediaList[currentIndex].isVideo,
				mediaList[currentIndex].isDir
			);
		}

		if (e.key === 'ArrowLeft') {
			currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
			openModal(
				mediaList[currentIndex].url,
				mediaList[currentIndex].isVideo,
				mediaList[currentIndex].isDir
			);
		}

		if (e.key === 'Enter') {
			if (mediaList[currentIndex].isDir) {
				closeModal();
				navigate(mediaList[currentIndex].url);
			}
		}
	});

	let isSwiping = false;
	let touchStartX = 0;

	modal.addEventListener('touchstart', (e) => {
		touchStartX = e.touches[0].clientX;
		isSwiping = false;
	}, {
		passive: true
	});

	modal.addEventListener('touchmove', (e) => {
		const dx = e.touches[0].clientX - touchStartX;
		if (Math.abs(dx) > 10) {
			isSwiping = true;
		}
	}, {
		passive: true
	});

	modal.addEventListener('touchend', (e) => {
		const touchEndX = e.changedTouches[0].clientX;
		const dx = touchEndX - touchStartX;

		const threshold = 50;

		if (Math.abs(dx) < threshold) return;

		if (dx > 0) {
			// right swipe: prev
			currentIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
		} else {
			// left swipe: next
			currentIndex = (currentIndex + 1) % mediaList.length;
		}

		openModal(
			mediaList[currentIndex].url,
			mediaList[currentIndex].isVideo,
			mediaList[currentIndex].isDir
		);
	}, {
		passive: true
	});

	async function loadDir(path) {
		const dirURL = buildAbsURL(path);
		showStatus('Loading ' + dirURL.pathname + ' …');
		grid.innerHTML = '';
		renderCrumbs(dirURL.pathname);

		let res;
		try {
			res = await fetch(dirURL.pathname, {
				credentials: 'same-origin'
			});
		} catch (err) {
			showStatus('Fetch error: ' + err.message, true);
			return;
		}
		if (!res.ok) {
			showStatus('HTTP ' + res.status + ' loading ' + dirURL.pathname, true);
			return;
		}
		const html = await res.text();
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const anchors = Array.from(doc.querySelectorAll('a'));

		const IMG_RE = /\.(png|jpe?g|gif|webp|svg)$/i;
		const VIDEO_RE = /\.(mp4|webm)$/i;

		// Nginx autoindex often has Parent Directory as "../"; skip that.
		const items = anchors
			.map(a => a.getAttribute('href'))
			.filter(href => href && href !== '../')
			.map(href => ({
				href,
				isDir: href.endsWith('/'),
				isImg: IMG_RE.test(href),
				isVideo: VIDEO_RE.test(href)
			}));

		// Folders first, then files by name
		items.sort((a, b) => {
			if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
			return a.href.localeCompare(b.href, undefined, {
				numeric: true
			});
		});

		if (items.length === 0) {
			showStatus('Empty directory.');
			return;
		}

		mediaList = [];

		for (const it of items) {
			// show only folders + image + video files
			if (!it.isDir && !it.isImg && !it.isVideo) continue;
			const full = new URL(it.href, dirURL).pathname; // NOTE: base must be absolute URL
			mediaList.push({
				url: full,
				isVideo: it.isVideo,
				isDir: it.isDir
			});

			const wrap = document.createElement('div');
			wrap.className = 'item';

			const tile = document.createElement('a');
			tile.href = '#';
			tile.className = 'thumb';

			const name = document.createElement('div');
			name.className = 'name';
			name.textContent = safeDecode(it.href.replace(/\/$/, ''));

			if (it.isDir) {
				const icon = document.createElement('div');
				icon.className = 'folder';
				icon.textContent = '📁';
				tile.appendChild(icon);
				tile.addEventListener('click', (e) => {
					if (isSwiping) {
						isSwiping = false;
						return;
					}
					e.preventDefault();
					navigate(full);
				});
			} else if (it.isImg) {
				const img = document.createElement('img');
				img.loading = 'lazy';
				img.decoding = 'async';
				img.src = full;
				tile.appendChild(img);
				// click opens original image in modal window
				tile.addEventListener('click', (e) => {
					if (isSwiping) {
						isSwiping = false;
						return;
					}
					e.preventDefault();
					openModal(full, false, false);
				});
			} else if (it.isVideo) {
				const video = document.createElement('video');
				video.src = full;
				video.muted = true;
				video.loop = true;
				video.playsInline = true;
				video.autoplay = true; // light preview
				video.style.maxWidth = '100%';
				video.style.maxHeight = '100%';
				video.preload = 'metadata';
				tile.appendChild(video);

				tile.addEventListener('click', (e) => {
					if (isSwiping) {
						isSwiping = false;
						return;
					}
					e.preventDefault();
					openModal(full, true, false);
				});
			}

			wrap.appendChild(tile);
			wrap.appendChild(name);
			grid.appendChild(wrap);
		}

		showStatus('');
	}

	function navigate(path) {
		const p = normPath(path);
		setURL(p);
		loadDir(p);
	}

	// Initial path: ?p=/some/dir/ or #/some/dir/ or default to root ("/")
	const sp = new URLSearchParams(location.search);
	let start = sp.get('p') || (location.hash ? location.hash.slice(1) : '/');
	loadDir(normPath(start));

	// Support back/forward buttons
	window.addEventListener('popstate', (e) => {
		const p = e.state?.p || new URLSearchParams(location.search).get('p') || '/';
		loadDir(normPath(p));
	});
})();
