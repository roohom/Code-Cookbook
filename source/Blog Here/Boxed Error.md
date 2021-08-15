# java.util.concurrent.ExecutionException: Boxed Error

两篇文章:

- [Scala Snacks: Part 2 - Don't assert your requirement by Daniel Tattan-Birch](https://www.signifytechnology.com/blog/2018/10/scala-snacks-part-2-dont-assert-your-requirement-by-daniel-tattan-birch)
- [What is a Boxed Error in Scala?](https://stackoverflow.com/questions/17265022/what-is-a-boxed-error-in-scala)

最近在运行springboot整合spark的项目时，程序偶尔在通过spark-submit提交的时候报如下异常:

~~~java
java.util.concurrent.ExecutionException: Boxed Error
~~~

并且，该错误还是偶发性的，并不是一定会发生，解决办法是重试一遍就OK了。目前还没有弄明白是什么原因，上面的两篇文章说了这是scala所抛出的错误，其底层原因被包装，但我还是不清楚为什么这种错误会抛出，并且还是偶发性的呢？