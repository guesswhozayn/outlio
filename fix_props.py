import re

with open('src/app/page.js', 'r') as f:
    content = f.read()

# Replace `am.someProp={am.someVal}` with `someProp={am.someVal}`
# We can match `am.([a-zA-Z0-9_]+)=` and replace with `\1=`
content = re.sub(r'am\.([a-zA-Z0-9_]+)=', r'\1=', content)

with open('src/app/page.js', 'w') as f:
    f.write(content)
