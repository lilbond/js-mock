# A simple NodeJS based mock server

## Usage

```
node index.js
```

### With Mock Data

Replace JSON in `data` folder and use the endpoint

```
http://localhost:7000/mock
```

### Simple greetings

```
http://localhost:7000/greetings
```

### Delayed response

```
http://localhost:7000/delayed?delay=3000
```

Change value of delay according to use. No type check is or error handling is done. Please use valid `integer`.

### Internal Server Error

```
http://localhost:7000/error/500
```
