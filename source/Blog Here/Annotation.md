## 元注解
元注解是针对自定义注解的
补充:枚举(Enum)
~~~java
public enum 枚举名{
    市区
    县城
    乡镇
    村庄
}
~~~


- @target
    - 可选的参数值在枚举类ElementType中包括
    - TYPE
    - FIELD
    - METHOD
    - PARAMETER
    - CONSTRUCTOR
    - LOCAL_VARIABLE
- @Retention
    - 作用 : 定义该注解的生命周期(有效范围)
    - 可选额参数值在枚举类型RetentionPolicy
    - SOURCE
        - 针对一些检查性的操作，比如@override
    - CLASS
        - 使用场景：在编译时进行一些预处理操作，比如：生成一些辅助代码，就用CLASS注解
    - RUNTIME
        - 使用得最多
        - 要在运行时去动态获取注解信息，那只能用RUNTIME注解
        
## 注解解析        
在开发中，针对注解进行Java代码解析开发时，需要使用到:
Annotation:所有注解类型的公共接口，类似所有类的父类是Object
AnnotationElement:封装了解析注解的相关方法

- 常用方法
    - boolean isAnnotationPresent(class annotationClass)判断当前对象是否有指定的注解
      比如: Bookshelf对象.isAnnotationPresent(Book.class),也可以是方法对象、构造器对象、成员变量对象
      
    - T getAnnotation(Class<T> annotationClass) 获得当前对象上指定的注解对象
      比如:
    