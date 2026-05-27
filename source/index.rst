.. Code-Cookbook documentation master file, created by
   sphinx-quickstart on Tue Oct 27 13:22:34 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Roohom's Code-Cookbook
=========================================

.. raw:: html

   <main class="cc-home-shell" aria-label="Code-Cookbook home">
     <canvas class="cc-home-particles" aria-hidden="true"></canvas>
     <header class="cc-home-nav">
       <a class="cc-home-brand" href="index.html" aria-label="Code-Cookbook 首页">
         <span class="cc-home-mark" aria-hidden="true"></span>
         <span>Code-Cookbook</span>
       </a>
       <nav class="cc-home-menu" aria-label="首页导航">
         <div class="cc-home-menu-item">
           <a href="articles.html">文章</a>
           <div class="cc-home-dropdown">
             <a href="Blog%20Here/index.html">工程实践</a>
             <a href="Bigdata/index.html">大数据</a>
             <a href="SQL/index.html">SQL</a>
             <a href="Auxiliary%20tools/index.html">工具链</a>
           </div>
         </div>
         <div class="cc-home-menu-item">
           <a href="projects.html">项目</a>
           <div class="cc-home-dropdown">
             <a href="Bigdata%20Tools/index.html">Bigdata Tools</a>
             <a href="Auxiliary%20tools/index.html">Auxiliary Tools</a>
           </div>
         </div>
         <a href="#about">关于我</a>
         <a class="cc-home-search" href="search.html" aria-label="搜索文章">⌕</a>
       </nav>
       <a class="cc-home-subscribe" href="https://github.com/roohom/Code-Cookbook" target="_blank" rel="noopener">订阅</a>
     </header>

     <section class="cc-home-hero">
       <div class="cc-home-center">
         <div class="cc-home-symbol" aria-hidden="true">◇</div>
         <p class="cc-home-kicker">Personal technical cookbook</p>
         <h1 class="cc-home-title">代码烹饪指南</h1>
         <p class="cc-home-subtitle">
           可能出错的地方就一定会出错。
         </p>
         <div class="cc-home-actions">
           <a href="Blog%20Here/index.html">阅读最新文章</a>
           <a href="#about">了解更多</a>
         </div>
       </div>
     </section>

     <section class="cc-home-section cc-home-latest" data-home-reveal>
       <div class="cc-home-section-lead">
         <p>2026 · 持续更新</p>
         <h2>最新思考</h2>
       </div>
       <div class="cc-home-articles">
         <article class="cc-home-article-card">
           <a href="Blog%20Here/[Flink]Flink%20on%20k8s任务的提交和实操.html">
             <span>Flink / Kubernetes</span>
             <h3>Flink on k8s 任务的提交和实操</h3>
             <p>把一次真实部署过程拆成环境、命令、排错和收尾。</p>
             <time>2026-05-27</time>
           </a>
         </article>
         <article class="cc-home-article-card">
           <a href="Blog%20Here/[Flink]监控Flink%20Metrics.html">
             <span>Flink / Metrics</span>
             <h3>监控 Flink Metrics</h3>
             <p>从指标暴露到排查链路，整理流任务观测的关键线索。</p>
             <time>2026-05-27</time>
           </a>
         </article>
         <article class="cc-home-article-card">
           <a href="SQL/index.html">
             <span>SQL / Data</span>
             <h3>SQL 问题与业务查询模式</h3>
             <p>记录 JOIN、窗口函数、连续登录和宽表设计里的常见判断。</p>
             <time>2026-05-27</time>
           </a>
         </article>
       </div>
     </section>

     <section class="cc-home-section cc-home-toolbox" data-home-reveal>
       <h2>我的工具箱</h2>
       <div class="cc-home-tools" aria-label="技术栈">
         <span title="Java">Java</span>
         <span title="Flink">Flink</span>
         <span title="Spark">Spark</span>
         <span title="Hive">Hive</span>
         <span title="Kafka">Kafka</span>
         <span title="SQL">SQL</span>
         <span title="Docker">Docker</span>
         <span title="Kubernetes">K8s</span>
         <span title="Python">Python</span>
       </div>
     </section>

     <section id="about" class="cc-home-section cc-home-about" data-home-reveal>
       <div class="cc-home-avatar" aria-hidden="true">R</div>
       <div>
         <h2>关于我</h2>
         <p>
           我是 Roohom，长期和数据平台、后端系统、SQL 与工程工具打交道。
           这里保存那些值得复盘的问题，也保存下一次更快抵达答案的路径。
         </p>
         <div class="cc-home-socials">
           <a href="https://github.com/roohom/Code-Cookbook" target="_blank" rel="noopener">GitHub</a>
           <a href="search.html">Search</a>
           <a href="genindex.html">Index</a>
         </div>
       </div>
     </section>

     <footer class="cc-home-footer">
       <span>© 2026 Code-Cookbook</span>
       <a href="genindex.html">RSS</a>
       <a href="Blog%20Here/index.html">Articles</a>
       <a href="#about">About</a>
     </footer>
   </main>

.. toctree::
   :maxdepth: 2
   :caption: 博客
   :glob:
   :hidden:
   
   
   Blog Here/index
   articles
   projects

.. toctree::
   :maxdepth: 2
   :caption: Random ramblings
   :glob:
   :hidden:

   Random ramblings/index

.. toctree::
   :maxdepth: 2
   :caption: 大数据
   :glob:
   :hidden:
   
   
   Bigdata/index
   Bigdata Tools/index
   
   
.. toctree::
   :maxdepth: 2
   :caption: 大数据辅助工具
   :glob:
   :hidden:
   
   
   Auxiliary tools/index
   

.. toctree::
   :maxdepth: 2
   :caption: SQL相关
   :glob:
   :hidden:
   
   
   SQL/index
