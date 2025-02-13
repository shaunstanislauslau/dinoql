const dql = require('../src');
const { addResolvers } = require('../src');

describe('[dql] { keep: false }', () => {
  let data = {};
  beforeEach(() => {
    data = {
      test: {
        test2: {
          test3: {
            test4: {
              test5: 10,
              box: [
                { name: { full: true }, age: 10 },
                { name: { full: false }, age: 2 }
              ]
            },
            age: 10
          }
        }
      },
      peoples: 2
    };
  });

  test('should return only values from last nesting', () => {
    const value = dql(data)` 
      test { 
        test2 { 
          test3 { 
            test4 { 
               test5
            },
            age
          },
        }
      }`;

    const dataFiltered = {
      test5: 10,
      age: 10
    };

    expect(value).toEqual(dataFiltered)
  });

  test('should return only values using aliases', () => {
    const value = dql(data)` 
      test { 
        test2 { 
          test3 { 
            test4 { 
               test5
            },
            ageChanged: age
          },
        }
      }`;

    const dataFiltered = {
      test5: 10,
      ageChanged: 10
    };

    expect(value).toEqual(dataFiltered)
  });

  test('shouldn\'t get keys that value is undefined or null', () => {
    const value = dql(data)` 
      test { 
        testdsjj { 
          testsdjsjk { 
            test4skdjsdsj { 
               test5sldksldks
            } 
          }
        }
      }`;

    expect(value).toEqual({})
  });

  test('shouldn\'t get keys that value is undefined or null from array', () => {
    const newdata = {
      data: [{ test: 1 }]
    };

    const value = dql(newdata)` 
      data { 
        testdsjj 
      }`;

    expect(value).toEqual({})
  });

  test('should get error when resolver does not exist', () => {
    try {
      const value = dql(data)` 
      test { 
        test1(defaultValue: 10, rskkskksks: 10)
      }`;
    } catch(e){
      expect(e.message).toBe('Resolver "rskkskksks" does not exist.');
    }
  });

  test('should works in arrays', () => {
    const newData = {
      data: {
        users: [{
          name: 'Victor Igor',
          id: "100",
          age: 40,
          test: {
            text: true,
            html: {
              _data: {}
            }
          }
        }, {
          name: 'Kant Jonas',
          id: "200",
          age: 35,
          test: {
            text: true,
            html: {
              _data: {}
            }
          }
        }]
      }
    };

    const value = dql(newData)`
      data {
        users(id: "200") {
          name
        }
      }
    `;

    const dataFiltered = {
      users: [{ name: 'Kant Jonas' }]
    };

    expect(value).toEqual(dataFiltered);
  });

  test('should works nesting array', () => {
    const newdata = {
      data: {
        users: [{
          name: 'Victor Igor',
          id: "100",
          age: 40,
          test: {
            text: true,
            html: {
              _data: {}
            }
          }
        }, {
          name: 'Kant Jonas',
          id: "200",
          age: 35,
          test: {
            text: 'he',
            html: {
              _data: [{ name: 'vic', age: 20 }]
            }
          }
        }]
      }
    };

    const value = dql(newdata)`
      data {
        users(id: "200") {
          name,
          test {
            text,
            html {
              _data {
                name
              }
            }
          }
        }
      }
    `;

    const dataFiltered = {
      users: [{ name: 'Kant Jonas', text: 'he', _data: [{ name: 'vic' }] }]
    };

    expect(value).toEqual(dataFiltered);
  });

  test('should works parsing to array and filter', () => {
    const newdata = {
      data: {
        users: [{
          name: 'Victor Igor',
          id: "100",
          age: 40,
          test: {
            text: true,
            html: {
              _data: {}
            }
          }
        }, {
          name: 'Kant Jonas',
          id: "200",
          age: 35,
          test: {
            text: 'he',
            html: {
              _data: { name: 'vic', age: { text: '30'}, title: { text: 'jose'} },
              _other: { name: 'vic', age: { text: '20'}, title: { text: 'icon'} }
            }
          }
        }]
      }
    };

    const value = dql(newdata)`
      data {
        users(id: "200") {
          name,
          test {
            text,
            html(getObjectValues: true) {
              title {
                title: text
              },
              
              age {
                age: text
              }
            }
          }
        }
      }
    `;

    const dataFiltered = {
      users: [{
        name: 'Kant Jonas',
        text: 'he',
        html: [{ title: 'jose', age: '30' }, { title: 'icon', age: '20' }] }]
    };

    expect(value).toEqual(dataFiltered);
  });

  test('should works custom resolvers', () => {
    const inc = (list, prop) => {
      const valueToInc = Number(prop);
      return list.map(item => ({ ...item, age: item.age + valueToInc }));
    };

    addResolvers(({ inc }));

    const value = dql(data)`
      test {
        test2 {
          test3 {
            test4 {
              box(inc: 1)
            }
          }
        }
      }
    `;

    const dataChanged = {
      box: [{ name: { full: true}, age: 11}, { name: { full: false}, age: 3}]
    };

    expect(value).toEqual(dataChanged);
  });

  test('should works variables', () => {
    const newData = {
      users: [{ id: "200", name: 'Vic' }, { id: "300", name: 'Paul' }]
    };

    const variables = {
      id: "200"
    };

    const value = dql(newData, { variables })`
      users(id: $id)
    `;

    const dataExpected = {
      users: [{ id: '200', name: 'Vic'}]
    };

    expect(value).toEqual(dataExpected);
  });
});

