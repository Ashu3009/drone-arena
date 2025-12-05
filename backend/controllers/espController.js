// backend/controllers/espController.js
const ESPDevice = require('../models/ESPDevice');

// @desc    Get all registered ESP devices
// @route   GET /api/esp
exports.getAllESPs = async (req, res) => {
  try {
    const espDevices = await ESPDevice.find().sort({ droneId: 1 });

    res.json({
      success: true,
      count: espDevices.length,
      data: espDevices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available (unassigned) ESP devices
// @route   GET /api/esp/available
exports.getAvailableESPs = async (req, res) => {
  try {
    const espDevices = await ESPDevice.find({
      status: 'online',
      isActive: true
    }).sort({ droneId: 1 });

    res.json({
      success: true,
      count: espDevices.length,
      data: espDevices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register new ESP device (Manual from admin panel)
// @route   POST /api/esp/register
exports.registerESP = async (req, res) => {
  try {
    const { macAddress, droneId, role, nickname, deviceType } = req.body;

    // Validate required fields
    if (!macAddress || !droneId || !role) {
      return res.status(400).json({
        success: false,
        message: 'MAC address, Drone ID, and Role are required'
      });
    }

    // Check if MAC already exists
    const existingESP = await ESPDevice.findOne({ macAddress: macAddress.toUpperCase() });
    if (existingESP) {
      return res.status(400).json({
        success: false,
        message: 'ESP with this MAC address already registered'
      });
    }

    // Check if Drone ID already assigned
    const existingDrone = await ESPDevice.findOne({ droneId });
    if (existingDrone) {
      return res.status(400).json({
        success: false,
        message: `Drone ID ${droneId} is already assigned to MAC ${existingDrone.macAddress}`
      });
    }

    // Create ESP device
    const espDevice = await ESPDevice.create({
      macAddress: macAddress.toUpperCase(),
      droneId,
      role,
      nickname: nickname || `${droneId} ${role}`,
      deviceType: deviceType || 'ESP32-Dev',
      status: 'offline'
    });

    console.log(`✅ ESP Registered: ${droneId} → ${macAddress}`);

    res.status(201).json({
      success: true,
      message: 'ESP device registered successfully',
      data: espDevice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    ESP announces itself (Auto-discovery)
// @route   GET /api/esp/announce?mac=AA:BB:CC:DD:EE:01
exports.announceESP = async (req, res) => {
  try {
    const { mac } = req.query;

    if (!mac) {
      return res.status(400).json({
        success: false,
        message: 'MAC address is required'
      });
    }

    const macAddress = mac.toUpperCase();

    // Find ESP by MAC
    let espDevice = await ESPDevice.findOne({ macAddress });

    if (!espDevice) {
      // ESP not registered yet - return unregistered status
      console.log(`⚠️  Unregistered ESP detected: ${macAddress}`);
      return res.json({
        success: true,
        registered: false,
        message: 'ESP not registered. Please register via admin panel.',
        macAddress
      });
    }

    // Update status to online and last seen
    await espDevice.updateStatus('online');

    console.log(`🟢 ESP Online: ${espDevice.droneId} (${macAddress})`);

    res.json({
      success: true,
      registered: true,
      data: {
        droneId: espDevice.droneId,
        role: espDevice.role,
        macAddress: espDevice.macAddress,
        nickname: espDevice.nickname
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    ESP heartbeat (keep-alive ping)
// @route   POST /api/esp/heartbeat
exports.heartbeat = async (req, res) => {
  try {
    const { mac, ipAddress } = req.body;

    if (!mac) {
      return res.status(400).json({
        success: false,
        message: 'MAC address is required'
      });
    }

    const espDevice = await ESPDevice.findOne({ macAddress: mac.toUpperCase() });

    if (!espDevice) {
      return res.status(404).json({
        success: false,
        message: 'ESP device not found'
      });
    }

    // Update status and IP
    espDevice.status = 'online';
    espDevice.lastSeen = new Date();
    if (ipAddress) {
      espDevice.ipAddress = ipAddress;
    }
    await espDevice.save();

    res.json({
      success: true,
      message: 'Heartbeat received'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update ESP device
// @route   PUT /api/esp/:id
exports.updateESP = async (req, res) => {
  try {
    const { droneId, role, nickname, deviceType, isActive } = req.body;

    const espDevice = await ESPDevice.findById(req.params.id);

    if (!espDevice) {
      return res.status(404).json({
        success: false,
        message: 'ESP device not found'
      });
    }

    // Check if new Drone ID already assigned to another ESP
    if (droneId && droneId !== espDevice.droneId) {
      const existingDrone = await ESPDevice.findOne({
        droneId,
        _id: { $ne: req.params.id }
      });

      if (existingDrone) {
        return res.status(400).json({
          success: false,
          message: `Drone ID ${droneId} is already assigned to another ESP`
        });
      }
    }

    // Update fields
    if (droneId) espDevice.droneId = droneId;
    if (role) espDevice.role = role;
    if (nickname !== undefined) espDevice.nickname = nickname;
    if (deviceType) espDevice.deviceType = deviceType;
    if (isActive !== undefined) espDevice.isActive = isActive;

    await espDevice.save();

    console.log(`✅ ESP Updated: ${espDevice.droneId} → ${espDevice.macAddress}`);

    res.json({
      success: true,
      message: 'ESP device updated successfully',
      data: espDevice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete ESP device
// @route   DELETE /api/esp/:id
exports.deleteESP = async (req, res) => {
  try {
    const espDevice = await ESPDevice.findById(req.params.id);

    if (!espDevice) {
      return res.status(404).json({
        success: false,
        message: 'ESP device not found'
      });
    }

    await espDevice.deleteOne();

    console.log(`❌ ESP Deleted: ${espDevice.droneId} (${espDevice.macAddress})`);

    res.json({
      success: true,
      message: 'ESP device deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get ESP by MAC address (for ESP to query itself)
// @route   GET /api/esp/whoami?mac=AA:BB:CC:DD:EE:01
exports.whoAmI = async (req, res) => {
  try {
    const { mac } = req.query;

    if (!mac) {
      return res.status(400).json({
        success: false,
        message: 'MAC address is required'
      });
    }

    const espDevice = await ESPDevice.findOne({
      macAddress: mac.toUpperCase(),
      isActive: true
    });

    if (!espDevice) {
      return res.status(404).json({
        success: false,
        registered: false,
        message: 'ESP not registered or inactive'
      });
    }

    // Update last seen
    await espDevice.updateStatus('online');

    res.json({
      success: true,
      registered: true,
      data: {
        droneId: espDevice.droneId,
        role: espDevice.role,
        teamColor: espDevice.teamColor,
        nickname: espDevice.nickname
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark offline ESPs (run periodically or on-demand)
// @route   POST /api/esp/check-offline
exports.checkOfflineESPs = async (req, res) => {
  try {
    const OFFLINE_THRESHOLD = 30000; // 30 seconds
    const now = new Date();

    const offlineESPs = await ESPDevice.updateMany(
      {
        status: 'online',
        lastSeen: { $lt: new Date(now - OFFLINE_THRESHOLD) }
      },
      { status: 'offline' }
    );

    console.log(`🔴 Marked ${offlineESPs.modifiedCount} ESPs as offline`);

    res.json({
      success: true,
      message: `${offlineESPs.modifiedCount} ESPs marked as offline`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
