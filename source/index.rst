.. Code-Cookbook documentation master file, created by
   sphinx-quickstart on Tue Oct 27 13:22:34 2020.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Roohom's Code-Cookbook
=========================================

.. raw:: html

   <div class="cc-home">
     <section class="cc-home-hero">
       <div>
         <div class="cc-home-kicker">Personal technical cookbook</div>
         <h1 class="cc-home-title">Code-Cookbook</h1>
         <p class="cc-home-subtitle">
           一个偏工程实践的个人技术笔记库，记录大数据、后端开发、SQL、工具使用，以及一些日常随笔。
           它不是完整教材，更像一本持续更新的 cookbook：遇到问题、拆解问题、留下可复用的线索。
         </p>
         <div class="cc-home-actions">
           <a href="Blog%20Here/index.html">开始阅读</a>
           <a href="SQL/index.html">SQL 笔记</a>
           <a href="Bigdata%20Tools/index.html">大数据工具</a>
         </div>
       </div>
       <aside class="cc-home-meta">
         <div><strong>Roohom</strong>Backend / Big Data / Daily notes</div>
         <div><strong>121+</strong>技术文章与问题记录</div>
         <div><strong>Built with Sphinx</strong>Hosted by Read the Docs</div>
       </aside>
     </section>

     <h2 class="cc-home-section-title">主要内容</h2>
     <section class="cc-home-grid">
       <article class="cc-home-card">
         <h2>博客</h2>
         <p>工程问题、框架实践、Java/Spring/Flink/Spark 的日常记录。</p>
         <a href="Blog%20Here/index.html">进入博客</a>
       </article>
       <article class="cc-home-card">
         <h2>大数据</h2>
         <p>数仓、数据倾斜、拉链表，以及 Hadoop、Hive、Flink、Spark 等工具。</p>
         <a href="Bigdata/index.html">查看大数据</a>
       </article>
       <article class="cc-home-card">
         <h2>SQL</h2>
         <p>SQL 题目、JOIN、执行顺序、数据库设计和常见业务查询模式。</p>
         <a href="SQL/index.html">查看 SQL</a>
       </article>
       <article class="cc-home-card">
         <h2>辅助工具</h2>
         <p>Docker、Avro、Sqoop 等工程辅助工具的使用记录。</p>
         <a href="Auxiliary%20tools/index.html">查看工具</a>
       </article>
       <article class="cc-home-card">
         <h2>随笔</h2>
         <p>技术之外的观察、想法和一些不太归类的记录。</p>
         <a href="Random%20ramblings/index.html">查看随笔</a>
       </article>
       <article class="cc-home-card">
         <h2>索引</h2>
         <p>保留 Sphinx 的全站索引和搜索能力，适合把它当知识库检索。</p>
         <a href="genindex.html">查看索引</a>
       </article>
     </section>
   </div>

.. toctree::
   :maxdepth: 2
   :caption: 博客
   :glob:
   :hidden:
   
   
   Blog Here/index

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
