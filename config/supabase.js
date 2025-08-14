const { createClient } = require('@supabase/supabase-js');

// For testing purposes, create a mock Supabase client
const createMockSupabase = () => {
  const mockUsers = new Map();
  const mockProfiles = new Map();
  const mockPosts = new Map();
  const mockEndorsements = new Map();
  const mockMessages = new Map();
  
  let userIdCounter = 1;
  let postIdCounter = 1;
  let endorsementIdCounter = 1;
  let messageIdCounter = 1;

  return {
    auth: {
      admin: {
        createUser: async ({ email, password, email_confirm }) => {
          const userId = `user_${userIdCounter++}`;
          const user = { id: userId, email };
          mockUsers.set(userId, { ...user, password });
          return { data: { user }, error: null };
        },
        deleteUser: async (userId) => {
          mockUsers.delete(userId);
          mockProfiles.delete(userId);
          return { error: null };
        }
      },
      signInWithPassword: async ({ email, password }) => {
        for (const [userId, user] of mockUsers) {
          if (user.email === email && user.password === password) {
            return { data: { user: { id: userId, email } }, error: null };
          }
        }
        return { data: null, error: { message: 'Invalid credentials' } };
      }
    },
    from: (table) => {
      const getTableData = () => {
        switch (table) {
          case 'profiles': return mockProfiles;
          case 'posts': return mockPosts;
          case 'endorsements': return mockEndorsements;
          case 'messages': return mockMessages;
          default: return new Map();
        }
      };

      const createQueryBuilder = (conditions = []) => ({
        eq: (field, value) => {
          const newConditions = [...conditions, { field, value, op: 'eq' }];
          return createQueryBuilder(newConditions);
        },
        or: (query) => {
          const newConditions = [...conditions, { query, op: 'or' }];
          return createQueryBuilder(newConditions);
        },
        gte: (field, value) => {
          const newConditions = [...conditions, { field, value, op: 'gte' }];
          return createQueryBuilder(newConditions);
        },
        range: (from, to) => ({
          ...createQueryBuilder(conditions),
          order: (field, options = {}) => ({
            then: async (callback) => {
              const data = getTableData();
              let results = Array.from(data.values());
              
              // Apply conditions
              results = results.filter(item => {
                return conditions.every(condition => {
                  if (condition.op === 'eq') {
                    return item[condition.field] === condition.value;
                  } else if (condition.op === 'gte') {
                    const itemDate = new Date(item[condition.field]);
                    const compareDate = new Date(condition.value);
                    return itemDate >= compareDate;
                  } else if (condition.op === 'or') {
                    // Handle or conditions for messages
                    if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                      const userIdMatches = condition.query.match(/\d+/g);
                      if (userIdMatches && userIdMatches.length >= 2) {
                        const [userId1, userId2] = userIdMatches;
                        return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                               (item.sender_id === userId2 && item.receiver_id === userId1);
                      }
                    }
                    return true;
                  }
                  return true;
                });
              });
              
              // Apply ordering
              if (field && options.ascending === false) {
                results.sort((a, b) => new Date(b[field]) - new Date(a[field]));
              } else if (field) {
                results.sort((a, b) => new Date(a[field]) - new Date(b[field]));
              }
              
              return callback({ data: results.slice(from, to + 1), error: null });
            }
          }),
          then: async (callback) => {
            const data = getTableData();
            let results = Array.from(data.values());
            
            // Apply conditions
            results = results.filter(item => {
              return conditions.every(condition => {
                if (condition.op === 'eq') {
                  return item[condition.field] === condition.value;
                } else if (condition.op === 'gte') {
                  const itemDate = new Date(item[condition.field]);
                  const compareDate = new Date(condition.value);
                  return itemDate >= compareDate;
                } else if (condition.op === 'or') {
                  // Handle or conditions for messages
                  if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                    const userIdMatches = condition.query.match(/\d+/g);
                    if (userIdMatches && userIdMatches.length >= 2) {
                      const [userId1, userId2] = userIdMatches;
                      return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                             (item.sender_id === userId2 && item.receiver_id === userId1);
                    }
                  }
                  return true;
                }
                return true;
              });
            });
            
            return callback({ data: results.slice(from, to + 1), error: null });
          }
        }),
        order: (field, options = {}) => ({
          ...createQueryBuilder(conditions),
          range: (from, to) => ({
            then: async (callback) => {
              const data = getTableData();
              let results = Array.from(data.values());
              
              // Apply conditions
              results = results.filter(item => {
                return conditions.every(condition => {
                  if (condition.op === 'eq') {
                    return item[condition.field] === condition.value;
                  } else if (condition.op === 'gte') {
                    const itemDate = new Date(item[condition.field]);
                    const compareDate = new Date(condition.value);
                    return itemDate >= compareDate;
                  } else if (condition.op === 'or') {
                    // Handle or conditions for messages
                    if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                      const userIdMatches = condition.query.match(/\d+/g);
                      if (userIdMatches && userIdMatches.length >= 2) {
                        const [userId1, userId2] = userIdMatches;
                        return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                               (item.sender_id === userId2 && item.receiver_id === userId1);
                      }
                    }
                    return true;
                  }
                  return true;
                });
              });
              
              // Apply ordering
              if (field && options.ascending === false) {
                results.sort((a, b) => new Date(b[field]) - new Date(a[field]));
              } else if (field) {
                results.sort((a, b) => new Date(a[field]) - new Date(b[field]));
              }
              
              return callback({ data: results.slice(from, to + 1), error: null });
            }
          }),
          then: async (callback) => {
            const data = getTableData();
            let results = Array.from(data.values());
            
            // Apply conditions
            results = results.filter(item => {
              return conditions.every(condition => {
                if (condition.op === 'eq') {
                  return item[condition.field] === condition.value;
                } else if (condition.op === 'gte') {
                  const itemDate = new Date(item[condition.field]);
                  const compareDate = new Date(condition.value);
                  return itemDate >= compareDate;
                } else if (condition.op === 'or') {
                  // Handle or conditions for messages
                  if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                    const userIdMatches = condition.query.match(/\d+/g);
                    if (userIdMatches && userIdMatches.length >= 2) {
                      const [userId1, userId2] = userIdMatches;
                      return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                             (item.sender_id === userId2 && item.receiver_id === userId1);
                    }
                  }
                  return true;
                }
                return true;
              });
            });
            
            // Apply ordering
            if (field && options.ascending === false) {
              results.sort((a, b) => new Date(b[field]) - new Date(a[field]));
            } else if (field) {
              results.sort((a, b) => new Date(a[field]) - new Date(b[field]));
            }
            
            return callback({ data: results, error: null });
          }
        }),
        single: async () => {
          const data = getTableData();
          for (const [id, item] of data) {
            const matches = conditions.every(condition => {
              if (condition.op === 'eq') {
                return item[condition.field] === condition.value;
              } else if (condition.op === 'gte') {
                const itemDate = new Date(item[condition.field]);
                const compareDate = new Date(condition.value);
                return itemDate >= compareDate;
              } else if (condition.op === 'or') {
                // Handle or conditions for messages
                if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                  const userIdMatches = condition.query.match(/\d+/g);
                  if (userIdMatches && userIdMatches.length >= 2) {
                    const [userId1, userId2] = userIdMatches;
                    return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                           (item.sender_id === userId2 && item.receiver_id === userId1);
                  }
                }
                return true;
              }
              return true;
            });
            
            if (matches) {
              return { data: item, error: null };
            }
          }
          return { data: null, error: null };
        },
        then: async (callback) => {
          const data = getTableData();
          let results = Array.from(data.values());
          
          // Apply conditions
          results = results.filter(item => {
            return conditions.every(condition => {
              if (condition.op === 'eq') {
                return item[condition.field] === condition.value;
              } else if (condition.op === 'gte') {
                const itemDate = new Date(item[condition.field]);
                const compareDate = new Date(condition.value);
                return itemDate >= compareDate;
              } else if (condition.op === 'or') {
                // Handle or conditions for messages
                if (condition.query.includes('sender_id') && condition.query.includes('receiver_id')) {
                  const userIdMatches = condition.query.match(/\d+/g);
                  if (userIdMatches && userIdMatches.length >= 2) {
                    const [userId1, userId2] = userIdMatches;
                    return (item.sender_id === userId1 && item.receiver_id === userId2) ||
                           (item.sender_id === userId2 && item.receiver_id === userId1);
                  }
                }
                return true;
              }
              return true;
            });
          });
          
          return callback({ data: results, error: null });
        }
      });

      return {
        select: (fields = '*', options = {}) => {
          if (options.count === 'exact' && options.head === true) {
            return {
              then: async (callback) => {
                const data = getTableData();
                const count = data.size;
                return callback({ count, error: null });
              }
            };
          }
          return createQueryBuilder();
        },
        insert: (data) => ({
          select: () => ({
            single: async () => {
              const id = table === 'posts' ? `post_${postIdCounter++}` : 
                        table === 'endorsements' ? `endorsement_${endorsementIdCounter++}` :
                        table === 'messages' ? `message_${messageIdCounter++}` :
                        `${table}_${Date.now()}`;
              
              const newItem = { 
                ...data, 
                id, 
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              getTableData().set(id, newItem);
              return { data: newItem, error: null };
            }
          }),
          then: async (callback) => {
            const id = `${table}_${Date.now()}`;
            const newItem = { ...data, id, created_at: new Date().toISOString() };
            getTableData().set(id, newItem);
            return callback({ data: newItem, error: null });
          }
        }),
        update: (data) => ({
          eq: (field, value) => ({
            select: () => ({
              single: async () => {
                const tableData = getTableData();
                for (const [id, item] of tableData) {
                  if (item[field] === value) {
                    const updated = { ...item, ...data, updated_at: new Date().toISOString() };
                    tableData.set(id, updated);
                    return { data: updated, error: null };
                  }
                }
                return { data: null, error: { message: 'Not found' } };
              }
            })
          })
        }),
        delete: () => createQueryBuilder()
      };
    },
    rpc: (functionName, params) => ({
      then: async (callback) => {
        // Mock RPC function for get_user_conversations
        if (functionName === 'get_user_conversations') {
          const conversations = []; // Return empty for mock
          return callback({ data: conversations, error: null });
        }
        return callback({ data: null, error: { message: 'RPC function not found' } });
      }
    })
  };
};

// Use mock Supabase for testing
const supabase = createMockSupabase();

module.exports = supabase;