const User = require('./User');
const RefreshToken = require('./RefreshToken');

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { User, RefreshToken };
