import { Item } from './Item.js'
import { ItemStatus } from './ItemStatus.js'
import { Location } from './Location.js'
import { Session } from './Session.js'
import { User } from './User.js'
import { UserRole } from './UserRole.js'

// --- ASOCJACJE (POWIĄZANIA) ---
Item.belongsTo(ItemStatus, { foreignKey: 'status_id', as: 'status' })
Item.belongsTo(Location, { foreignKey: 'location_id', as: 'location' })
Item.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' })
User.belongsTo(UserRole, { foreignKey: 'role_id', as: 'UserRole' })

export { Item, ItemStatus, Location, Session, User, UserRole }
