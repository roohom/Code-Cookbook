# [SQL]SQLLineage解析SQL血缘

## 前言

本文所用到的解析SQL的引擎或者说是包是sqllineage，[官方文档](https://sqllineage.readthedocs.io/en/latest/index.html)，[中文文档](http://www.sqllineage.com/index)

## 如何使用

### 安装

本地需要安装有python环境，推荐使用conda

使用conda生成一个虚拟环境，下载安装sqllineage包

~~~python
pip install sqllineage
~~~



### 命令行使用

~~~shell
$ sqllineage -e "insert into table_foo select * from table_bar union select * from table_baz"
Statements(#): 1
Source Tables:
    <default>.table_bar
    <default>.table_baz
Target Tables:
    <default>.table_fo
~~~

### 本地web服务

使用命令行启动

~~~shell
$ sqllineage -g -p 8080
~~~

将会在前台启动一个web服务，本地访问http://localhost:8080即可看到一个web页面，将需要解析的SQL输入Script view再返回Lineage View即可看到可视化的血缘图



## Python API解析

官方文档有详细的使用说明，下面用具体代码演示如何解析一个SQL，并生成一个json表示表的依赖关系

### 表级别血缘

#### Node

定义一个Node类，用来表示依赖关系图中的一个节点, 每个节点表示一张表，包含表的schema信息和表名信息

~~~python
class Node:
    def __init__(self, db_name, table_name):
        self.db_name = db_name
        self.table_name = table_name

    def to_dict(self):
        return {
            "dbName": self.db_name,
            "tableName": self.table_name
        }
~~~

#### Edge

定义一条边，用来表示依赖关系图中的一条边，也就是一条连线，包含起始端和目标端信息

~~~python
class Edge:
    def __init__(self, source, target):
        self.source = source
        self.target = target

    def to_dict(self):
        return {
            "source": self.source,
            "target": self.target
        }
~~~

#### Lineage

定义一个血缘关系，用来表示依赖关系图中一个节点和其对应的前置依赖节点(表)

~~~python
class Lineage:
    def __init__(self, nodes, edges):
        self.nodes = nodes
        self.edges = edges

    def to_dict(self):
        return {
            "nodes": self.nodes,
            "edges": self.edges
        }
~~~



解析指定SQL文件中的SQL，得到表的依赖关系：

~~~python
from sqllineage.runner import LineageRunner
import json
from node import *
from edge import *
from lineage import *


def parse(path, dialect):
    sql_file_path = path
    sql_file = open(sql_file_path, mode='r', encoding='utf-8')
    sql = sql_file.read().__str__()
    # 获取sql血缘
    result = LineageRunner(sql=sql, dialect=dialect)
    return result


if __name__ == '__main__':
    sql_path = """path/to/your/sql"""
    rs = parse(sql_path, "sparksql")
    print(rs)
    
    # 顶点
    nodes = []
    # 边
    edges = []
    # 结果表
    tables = rs.target_tables
    final_table_split = Node(None, None)
    if len(tables) > 0:
        final_table = rs.target_tables[0].__str__()
        table_split = final_table.split(".")
        final_table_split = Node(table_split[0], table_split[1])
        nodes.append(final_table_split.to_dict())
    
    # 解析源表
    s_tables = rs.source_tables
    for i in range(len(s_tables)):
        table_name = s_tables[i].__str__()
        split = table_name.split(".")
        n = Node(split[0], split[1])
        nodes.append(n.to_dict())
        e = Edge(source=n.to_dict(), target=final_table_split.to_dict())
        edges.append(e.to_dict())

    # NODES
    # print(json.dumps(nodes))

    # EDGES
    # print(json.dumps(edges))

    lineage = Lineage(nodes=nodes, edges=edges)
    # 输出json
    print(json.dumps(lineage.to_dict(), indent=4))

~~~



#### 测试

输入SQL:

~~~sql
INSERT OVERWRITE TABLE foo
SELECT a.col1,
       b.col1     AS col2,
       c.col3_sum AS col3,
       col4,
       d.*
FROM bar a
         JOIN baz b
              ON a.id = b.bar_id
         LEFT JOIN (SELECT bar_id, sum(col3) AS col3_sum
                    FROM qux
                    GROUP BY bar_id) c
                   ON a.id = sq.bar_id
         CROSS JOIN quux d;

INSERT OVERWRITE TABLE corge
SELECT a.col1,
       a.col2 + b.col2 AS col2
FROM foo a
         LEFT JOIN grault b
              ON a.col1 = b.col1;
~~~

运行上述代码，控制台将打印:

~~~json
Statements(#): 2
Source Tables:
    <default>.bar
    <default>.baz
    <default>.grault
    <default>.quux
    <default>.qux
Target Tables:
    <default>.corge
Intermediate Tables:
    <default>.foo
{
    "nodes": [
        {
            "dbName": "<default>",
            "tableName": "corge"
        },
        {
            "dbName": "<default>",
            "tableName": "bar"
        },
        {
            "dbName": "<default>",
            "tableName": "baz"
        },
        {
            "dbName": "<default>",
            "tableName": "grault"
        },
        {
            "dbName": "<default>",
            "tableName": "quux"
        },
        {
            "dbName": "<default>",
            "tableName": "qux"
        }
    ],
    "edges": [
        {
            "source": {
                "dbName": "<default>",
                "tableName": "bar"
            },
            "target": {
                "dbName": "<default>",
                "tableName": "corge"
            }
        },
        {
            "source": {
                "dbName": "<default>",
                "tableName": "baz"
            },
            "target": {
                "dbName": "<default>",
                "tableName": "corge"
            }
        },
        {
            "source": {
                "dbName": "<default>",
                "tableName": "grault"
            },
            "target": {
                "dbName": "<default>",
                "tableName": "corge"
            }
        },
        {
            "source": {
                "dbName": "<default>",
                "tableName": "quux"
            },
            "target": {
                "dbName": "<default>",
                "tableName": "corge"
            }
        },
        {
            "source": {
                "dbName": "<default>",
                "tableName": "qux"
            },
            "target": {
                "dbName": "<default>",
                "tableName": "corge"
            }
        }
    ]
}

~~~

### 字段级别血缘

输入SQL为:

~~~sql
INSERT INTO dw.c
SELECT m.col1 AS tag1, n.col2 AS tag2
FROM (SELECT col1, col2 FROM dw.a) m
JOIN (SELECT col1, col2 FROM dw.b) n
ON m.col1 = n.col1
~~~

应该解析得到:

~~~json
{
    "fields":[
        {
            "dbName":"dw",
            "fieldName":"col1",
            "tableName":"a"
        },
        {
            "dbName":"dw",
            "fieldName":"col2",
            "tableName":"b"
        },
        {
            "dbName":"dw",
            "fieldName":"tag1",
            "tableName":"c"
        },
        {
            "dbName":"dw",
            "fieldName":"tag2",
            "tableName":"c"
        }
    ],
    "edges":[
        {
            "source":{
                "dbName":"dw",
                "fieldName":"col1",
                "tableName":"a"
            },
            "target":{
                "dbName":"dw",
                "fieldName":"tag1",
                "tableName":"c"
            }
        },
        {
            "source":{
                "dbName":"dw",
                "fieldName":"col2",
                "tableName":"b"
            },
            "target":{
                "dbName":"dw",
                "fieldName":"tag2",
                "tableName":"c"
            }
        }
    ]
}
~~~





