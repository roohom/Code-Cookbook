# [Scala]函数中闭包(Closure)和柯里化(Currying)

> 闭包在英文中表达是Closure

## 何为闭包？

> 闭包是一个函数，返回值依赖于声明在函数外部的一个或多个变量。
>
> 闭包通常来讲可以简单的认为是可以访问一个函数里面局部变量的另外一个函数。

~~~scala
var factor = 3  
val multiplier = (i:Int) => i * factor  
~~~

这里我们引入一个自由变量 factor，这个变量定义在函数外面。

这样定义的函数变量 multiplier 成为一个"闭包"，因为它引用到函数外面定义的变量，定义这个函数的过程是将这个自由变量捕获而构成一个封闭的函数。

## 何为柯里化？

> 柯里化（Currying）是指将原先接受多个参数的方法转换为多个 只有一个参数 的参数列表的过程



~~~scala
scala> def add(x:Int)=(y:Int)=>x+y
add: (x: Int)Int => Int

scala> val result = add(1)
result: Int => Int = <function1>

scala> result(1)
res0: Int = 2
~~~



