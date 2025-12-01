import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb'
import { generateCode } from '@/lib/generateCode';

// Function to get client IP address
function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  let ip = null;
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIP) {
    ip = realIP.trim();
  } else if (cfConnectingIP) {
    ip = cfConnectingIP.trim();
  }
  
  // Normalize localhost IPs (::1 is IPv6 localhost, 127.0.0.1 is IPv4 localhost)
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    ip = '127.0.0.1'; // Normalize to IPv4 localhost
  }
  
  return ip || 'unknown';
}

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, phone} = await request.json()

    // Validation
    if (!name || !email || !phone ) {
      return Response.json(
        { message: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

  

    // Get client IP address
    const clientIP = getClientIP(request);

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if IP address has already registered
    if (clientIP && clientIP !== 'unknown') {
      const existingIPUser = await User.findOne({ 
        ipAddress: { $exists: true, $ne: null, $eq: clientIP }
      });

      console.log('Checking IP:', clientIP);
      console.log('Existing IP user found:', existingIPUser ? 'YES' : 'NO');
      if (existingIPUser) {
        console.log('Existing IP user details:', {
          name: existingIPUser.name,
          email: existingIPUser.email,
          ipAddress: existingIPUser.ipAddress
        });
      }

      if (existingIPUser) {
        console.log('❌ BLOCKED: Duplicate registration attempt from IP:', clientIP);
        return Response.json(
          { message: 'Maaf, pendaftaran hanya dapat dilakukan satu kali saja.' },
          { status: 400 }
        )
      }
      
      console.log('✅ IP check passed, allowing registration');
    } else {
      console.log('⚠️ IP address not detected or is unknown, skipping IP validation');
    }

    // Generate unique 4 digit code
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = generateCode();
      const exists = await User.findOne({ code });
      if (!exists) isUnique = true;
    }

    // Prepare user data with IP address
    const userData = {
      name,
      email,
      phone,
      ipAddress: clientIP,
      code,
      hasSpun: false,
      registeredAt: new Date()
    };

    // Add IP address if available
    if (clientIP && clientIP !== 'unknown') {
      userData.ipAddress = clientIP;
    }

    // console.log('Creating user with data:', { ...userData, phone: '***' });

    // Create new user with IP address
    const newUser = await User.create(userData);

    // console.log('✅ New user created successfully');
    // console.log('User ID:', newUser._id);
    // console.log('IP Address saved:', newUser.ipAddress || 'null');

    return Response.json({
      message: 'Registrasi berhasil',
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        code: newUser.code,
        ipAddress: newUser.ipAddress,
        hasSpun: newUser.hasSpun,
        registeredAt: newUser.registeredAt,
        _id: newUser._id,
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return Response.json(
      { message: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    )
  }
}