const fetch = require('node-fetch');
const fs = require('fs');

const token = 'de09ccc913e5107b80a51e92247ae1';

fetch(`https://graphql.datocms.com/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
})
.then(result => result.json())
.then(result => {
  // here we're filtering out any type information unrelated to unions or interfaces
  const filteredData = result.data.__schema.types.filter(
    type => type.possibleTypes !== null,
  );
  result.data.__schema.types = filteredData;
  fs.writeFile('./fragmentTypes.json', JSON.stringify(result.data), err => {
    if (err) console.error('Error writing fragmentTypes file', err);
    console.log('Fragment types successfully extracted!');
  });
});
