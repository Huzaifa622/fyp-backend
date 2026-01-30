const jwt = require('jsonwebtoken');
const http = require('http');

const secret = "#4$#%@#4@3$54^2#4@#4425$@34@3";
const token = jwt.sign(
    { email: 'test@example.com', userId: 1, firstName: 'Test', lastName: 'User', role: 'doctor' },
    secret,
    { expiresIn: '1h' }
);

console.log('Generated Token:', token);

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/doctor/1',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request:`, e);
});

req.end();
