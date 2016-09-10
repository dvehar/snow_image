You should set your `.git/hooks/pre-push` to:
```
#!/bin/bash
git rev-parse HEAD > .VERSION
git commit -am'update .VERSION'
```

