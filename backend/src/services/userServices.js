
const District = require("../models/Districts");
const Gharbeti = require("../models/Gharbeti");
const Kyc = require("../models/Kyc");
const KycImages = require("../models/kycImages");
const Municipal = require("../models/Municipal");
const Province = require("../models/Provinces");
const Role = require("../models/Role");
const ServiceProvider = require("../models/ServiceProvider");
const User = require("../models/User");


const { Op } = require("sequelize");
const sequelize = require("../config/db");
const { Sequelize } = require("sequelize");

const bcrypt = require("bcrypt");
const { checkValueInModel } = require("./validationServices");
const { get } = require("../app");

const getUserById = async(id)=>{
    // console.log("Fetching user by ID:", id);
    const user = await User.findOne({
        where: { id },
        attributes:{exclude:["password"]}
    });
    // console.log("User found by ID:", user);
    return user;
}

const getUserByEmail = async(email)=>{
    const user = await User.findOne({where:{email}});
    // console.log("User found by email:", user);
    return user;
}

const createUser = async(userData)=>{

  



  


  // if(userData.username){
  //   const usernameExist = await checkValueInModel(User,"username",userData.username)
  //   if(usernameExist){
  //     throw new Error("Username already exists please use another name")
  //   }
  // }
  const name = userData.name;

  if(typeof name!='string'){
    throw new Error("Name should be a character")
  }
  if(name.includes("@")){
    throw new Error("Name should not contain @")
  }
  if(name.includes(".")){
    throw new Error("Name should not contain (dot) .")
  }

   if (name.length < 2 || name.length > 50) {
    throw new Error("Name must be between 2 and 50 characters");
  }

        userData.username = userData.email.split("@")[0] + Math.floor(Math.random()*1000);
    console.log("Creating user with data:", userData);
    const user = await User.create(userData);
    return user;
}

const updateUser = async(id, userData)=>{
    const user = await User.findByPk(id);
    if(!user) throw new Error("User not found");
    await user.update(userData);
    return user;
}

const updateUserPassword = async (id, hashedPassword) => {
  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");

  await user.update({ password: hashedPassword });

  return user;
};



const deleteUser = async(id)=>{
    const user = await User.findByPk(id);
    if(!user) throw new Error("User not found");
    await user.destroy();
    return true;
}

const restoreUser = async(id)=>{
    const user = await User.findByPk(id,{paranoid:false});
    if(!user) throw new Error("User not found");
    await user.restore();
    return user;
}

const getAllUsers = async()=>{
    const users = await User.findAll({
        attributes:{exclude:["password"]}
    });
    return users;
}


const getUsersByRole = async(roleName)=>{
    const users = await User.findAll({
        include:[{
            model:Role,
            where:{name:roleName}
        }],
        attributes:{exclude:["password"]}
    });
    return users;
}

const assignRoleToUser = async(userId, roleName)=>{
    const user = await User.findByPk(userId);
    if(!user) throw new Error("User not found");
    let role = await Role.findOne({where:{name:roleName}});
    if(!role) throw new Error("Role not found");
    await user.addRole(role);
    return true;
}

const removeRoleFromUser = async(userId, roleName)=>{
    const user = await User.findByPk(userId);
    if(!user) throw new Error("User not found");
    let role = await Role.findOne({where:{name:roleName}});
    if(!role) throw new Error("Role not found");
    await user.removeRole(role);
    return true;
}


const blockUser = async(id)=>{
    const user = await User.findByPk(id);
    if(!user) throw new Error("User not found");
    user.is_active = false;
    await user.save();
    return user;
}

const unblockUser = async(id)=>{
    const user = await User.findByPk(id);
    if(!user) throw new Error("User not found");
    user.is_active = true;
    await user.save();
    return user;
}

const comparePassword = async (inputPassword, hashedPassword) => {
    
    return await bcrypt.compare(inputPassword, hashedPassword);
}


const getUserRole = async (user) => {
    const roles = await user.getRoles();
    console.log("User roles in getUserRole:", roles.map(r => r.name));
    
    
    return roles;
}

const checkGetUserRole = async(user)=>{
    try{
        const roles = await user.getRoles();
        return roles.map(r=>r.name);

    }
    catch(err){

    }
}

const getServiceProviderFromUserId = async (userId) => {
    console.log("Fetching Service Provider for userId:", userId);

    // Fetch ServiceProvider with user + location details
    const serviceProvider = await ServiceProvider.findOne({
        where: { userId },
        include: [
            {
                model: User,
                attributes: { exclude: ["password"] },
                include: [
                    {
                        model: Municipal,
                        attributes: ["id", "name_en", "name_np", "municipal_code"],
                        include: [
                            {
                                model: District,
                                attributes: ["id", "name_en", "name_np", "district_code"],
                                include: [
                                    {
                                        model: Province,
                                        attributes: ["id", "name_en", "name_np", "province_code"],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    if (!serviceProvider) {
        throw new Error(
            "Service Provider not found for this user. Please register as Service Provider."
        );
    }

    // Fetch all KYC records for this user
    const kycData = await Kyc.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']], // latest first
    });

    // Attach images to each KYC
    for (let kyc of kycData) {
        const kycImages = await KycImages.findAll({
            where: { kycId: kyc.id },
        });
        kyc.dataValues.kycImage = kycImages || [];
    }

    // Assign the array to serviceProvider
    serviceProvider.dataValues.kyc = kycData.length > 0 ? kycData : [];

    return serviceProvider;
};



const getGharbetiFromUserId = async(userId)=>{
    const gharbeti = await Gharbeti.findOne({where:{userId}});
    if(!gharbeti) throw new Error("Gharbeti not found for this user. Please register as Gharbeti.");
    return gharbeti;
}

const getGharbetiDetail = async (userId) => {
  console.log("Fetching Gharbeti details for userId:", userId);


  const gharbeti = await Gharbeti.findOne({
    where: { userId },
    attributes:['is_paid','is_verified'],

    include: [
      
      {
        model: User,
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Municipal,
            attributes: ["id", "name_en", "name_np", "municipal_code"],
            include: [
              {
                model: District,
                attributes: ["id", "name_en", "name_np", "district_code"],
                include: [
                  {
                    model: Province,
                    attributes: ["id", "name_en", "name_np", "province_code"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!gharbeti)
    throw new Error(
      "Gharbeti profile not found for this user. Please register as Gharbeti."
    );
  const kycData = await Kyc.findOne({ where: { userId } });
  const kycImage = await KycImages.findAll({
    where: { kycId: kycData ? kycData.id : null },
  });

  if (kycData) {
    gharbeti.dataValues.kyc = kycData;
    gharbeti.dataValues.kyc.dataValues.kycImage = kycImage || null;
  } else {
    gharbeti.dataValues.kyc = null;
  }

  // Return structured response similar to ServiceProvider
  return {
    status: "success",
    code: 200,
    message: "Gharbeti profile fetched successfully.",
    data: {
      gharbeti,
    },
  };
};


const checkServiceProviderFromUserId = async(userId)=>{
    const serviceProvider = await ServiceProvider.findOne({where:{userId}});
    return serviceProvider ? serviceProvider : null;
}


// update user ko profile picture 

const updateUserProfilePicture = async(userId,file)=>{
    console.log("Updating profile picture for userId:", userId, "with file:", file);
    const user = await User.findByPk(userId);
    if(!user) throw new Error("User not found");
    user.profile_picture = file.profile_url;
    await user.save();
    return user;
}

// INCLUDE PROVINCE DISTRICT MUNICIPAL, ROLES, KYC IMAGES, DOCUMENTS ETC.
const getUserFullDetails = async (userId) => {
  console.log("Fetching full details for userId:", userId);

  // 1️⃣ Fetch the user
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Municipal,
        attributes: ["id", "name_en", "name_np", "municipal_code"],
        include: [
          {
            model: District,
            attributes: ["id", "name_en", "name_np", "district_code"],
            include: [
              {
                model: Province,
                attributes: ["id", "name_en", "name_np", "province_code"],
              },
            ],
          },
        ],
      },
      {
        model: Role,
        attributes: ["id", "name"],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) throw new Error("User not found");


  const kycs = await Kyc.findAll({
    where: { userId },
    include: [
      {
        model: KycImages,
        attributes: ["id", "image_path", "image_type", "kycId", "createdAt", "updatedAt"],
      },
    ],
    order: [["createdAt", "DESC"]], 
  });

  // 3️⃣ Attach KYCs to user object manually
  const userObj = user.get({ plain: true });
  userObj.kycs = kycs.map(k => k.get({ plain: true }));

  return userObj;
};





const getAllUsersWithPaginations = async ({
  role = "all",
  status = "active",
  search = "",
  page = 1,
  limit = 20,
}) => {
  const offset = (page - 1) * limit;

  // Build where clause for users table
  const where = {};

  // Status filter
  if (status === "active") where.is_active = true;
  else if (status === "blocked") where.is_active = false;

  // Search filter
  if (search) {
    const q = search.trim().toLowerCase();
    where[Op.or] = [
      Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("user.name")),
        { [Op.like]: `%${q}%` }
      ),
      Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("user.email")),
        { [Op.like]: `%${q}%` }
      ),
    ];
  }

  // Include roles with optional role filtering
  const include = [
    {
      model: Role,
      attributes: ["name"],
      through: { attributes: [] }, // hide join table
      required: role && role !== "all", // only required if filtering by role
      where: role && role !== "all" ? { name: role } : undefined,
    },
  ];

  // Fetch users with pagination
  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    include,
    offset,
    limit,
    distinct: true, // ensures correct count with joins
    order: [["createdAt", "DESC"]],
  });

  // Map users to plain objects
  const mappedUsers = users.map((u) => {
    const userObj = u.get({ plain: true });
    const userRole = userObj.roles?.[0]?.name || "User"; // safe check for role
    return {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      role: userRole,
      is_active: userObj.is_active,
      status: userObj.is_active ? "active" : "blocked",
      createdAt: userObj.createdAt,
    };
  });

  return { users: mappedUsers, total };
};



module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    getAllUsers,
    getUsersByRole,
    assignRoleToUser,
    removeRoleFromUser,
    blockUser,
    unblockUser,
    comparePassword,
    getUserRole,
    checkGetUserRole,
    getServiceProviderFromUserId,
    getGharbetiFromUserId,
    checkServiceProviderFromUserId,
    updateUserPassword,
    updateUserProfilePicture,
    getUserFullDetails,
    getAllUsersWithPaginations,
    getGharbetiDetail

}