import User from "../models/User.js";

export async function syncUser(req, res) {
  try {
    const { userId } = req.auth();
    const { email, firstName, lastName, imageUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user already exists
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Create new user
      user = await User.create({
        clerkId: userId,
        email,
        name: `${firstName} ${lastName}`.trim() || "User",
        profileImage: imageUrl,
      });
    } else {
      // Update existing user with latest info
      user = await User.findByIdAndUpdate(
        user._id,
        {
          email,
          name: `${firstName} ${lastName}`.trim() || user.name,
          profileImage: imageUrl,
        },
        { new: true }
      );
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in syncUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = req.user;
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getCurrentUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
