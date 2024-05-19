# UI

Testing Source Explorer
```
------------------------------------------------------------
Dir         | Funcs     |   | Test | Source(And Coverage) |
____        |           |    ------ -----------------------
src         |     A     |
 main.go    |     B     |
            |           |       ....
            ------------
            |  Cases    |
            |           |
            |    A.1    |
            |    A.2    |
-----------------------------------------------------------|

```

# Components
```
[http-api]
LocalGitTestingSourceExplorer --------------|
                                            |
                                            |
EndpointDebugTraceExplorer -|               |
                            |               |
                            |               |           
[structure]                 |               v
                            |       TestingSourceExplorer--|
                            |                              |
                            |                              |
                            v                              |
              DebugTraceExplorer---|                       |
                                   |                       |
                                   |                       |
[layouts]                          v                       v
                    BaseDebugTraceExplorer            BaseTestingSourceExplorer

```