// 简易 Hash 路由
const Router = {
  routes: {},
  
  // 注册路由
  register(path, handler) {
    this.routes[path] = handler;
  },
  
  // 导航
  navigate(path) {
    window.location.hash = path;
  },
  
  // 解析并执行路由
  resolve() {
    const hash = window.location.hash.slice(1) || '/assets';
    const handler = this.routes[hash];
    if (handler) {
      handler();
    } else {
      // 默认到资产页
      this.routes['/assets'] && this.routes['/assets']();
    }
  },
  
  // 初始化监听
  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};
