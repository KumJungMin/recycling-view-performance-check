import { renderFull } from './pages/full'
import { renderVirtual } from './pages/virtual'
import { renderHome } from './pages/home'

const app = document.getElementById('app')!
const navLinks = document.querySelectorAll<HTMLAnchorElement>('.nav a')

function updateActiveLink(route: string) {
  navLinks.forEach((link) => {
    if (link.dataset.route === route) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

function router() {
  const path = window.location.pathname

  if (path === '/full' || path === '/full.html') {
    updateActiveLink('full')
    renderFull(app)
  } else if (path === '/virtual' || path === '/virtual.html') {
    updateActiveLink('virtual')
    renderVirtual(app)
  } else {
    updateActiveLink('home')
    renderHome(app)
  }
}

// 초기 라우팅
router()

// 네비게이션 클릭 이벤트
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault()
    const route = link.dataset.route || ''
    if (route === 'home') {
      window.history.pushState({}, '', '/')
    } else {
      window.history.pushState({}, '', `/${route}`)
    }
    router()
  })
})

// 브라우저 뒤로/앞으로 버튼 처리
window.addEventListener('popstate', router)

