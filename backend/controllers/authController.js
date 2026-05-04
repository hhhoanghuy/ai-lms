const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../services/mailService');

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Người dùng đã tồn tại' });

    const user = await User.create({ name, email, password, role });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập' });
  }
};

const forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng với email này' });
  }

  // Generate Reset Token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://localhost:5173/reset-password/${resetToken}`;

  const message = `Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng bấm vào link sau để hoàn tất quá trình: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Khôi phục mật khẩu - AI Grading LMS',
      message,
      html: `
        <h3>Khôi phục mật khẩu</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng bấm vào nút bên dưới để thực hiện:</p>
        <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
        <p>Link này sẽ hết hạn sau 10 phút.</p>
      `
    });

    res.status(200).json({ success: true, message: 'Email đã được gửi' });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ message: 'Không thể gửi email' });
  }
};

const resetPassword = async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};
