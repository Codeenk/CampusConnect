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

      return {
        select: (fields = '*') => ({
          eq: (field, value) => ({
            eq: (field2, value2) => ({
              single: async () => {
                const data = getTableData();
                for (const [id, item] of data) {
                  if (item[field] === value && item[field2] === value2) {
                    return { data: item, error: null };
                  }
                }
                return { data: null, error: { message: 'Not found' } };
              },
              then: async (callback) => {
                const data = getTableData();
                const results = Array.from(data.values()).filter(item => 
                  item[field] === value && item[field2] === value2
                );
                return callback({ data: results, error: null });
              }
            }),
            single: async () => {
              const data = getTableData();
              for (const [id, item] of data) {
                if (item[field] === value) {
                  return { data: item, error: null };
                }
              }
              return { data: null, error: { message: 'Not found' } };
            },
            then: async (callback) => {
              const data = getTableData();
              const results = Array.from(data.values()).filter(item => item[field] === value);
              return callback({ data: results, error: null });
            }
          }),
          gte: (field, value) => ({
            then: async (callback) => {
              const data = getTableData();
              const results = Array.from(data.values()).filter(item => {
                const itemDate = new Date(item[field]);
                const compareDate = new Date(value);
                return itemDate >= compareDate;
              });
              return callback({ data: results, error: null });
            }
          }),
          single: async () => {
            const data = getTableData();
            const first = data.values().next().value;
            return { data: first || null, error: first ? null : { message: 'Not found' } };
          },
          order: () => ({
            then: async (callback) => {
              const data = Array.from(getTableData().values());
              return callback({ data, error: null });
            }
          }),
          range: () => ({
            order: () => ({
              then: async (callback) => {
                const data = Array.from(getTableData().values());
                return callback({ data, error: null });
              }
            })
          }),
          then: async (callback) => {
            const data = Array.from(getTableData().values());
            return callback({ data, error: null });
          }
        }),
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
        delete: () => ({
          eq: (field, value) => ({
            eq: (field2, value2) => ({
              then: async (callback) => {
                const tableData = getTableData();
                for (const [id, item] of tableData) {
                  if (item[field] === value && item[field2] === value2) {
                    tableData.delete(id);
                    return callback({ error: null });
                  }
                }
                return callback({ error: { message: 'Not found' } });
              }
            }),
            then: async (callback) => {
              const tableData = getTableData();
              for (const [id, item] of tableData) {
                if (item[field] === value) {
                  tableData.delete(id);
                  return callback({ error: null });
                }
              }
              return callback({ error: { message: 'Not found' } });
            }
          })
        })
      };
    }
  };
};

// Use mock Supabase for testing
const supabase = createMockSupabase();

module.exports = supabase;