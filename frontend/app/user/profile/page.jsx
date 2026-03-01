"use client"
import HeaderNavbar from "@/app/landingpagecomponents/components/HeaderNavbar";
import { useSelector } from "react-redux";
import { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Shield,
  Star,
  Award,
  Settings,
  Bell,
  Heart,
  MessageCircle,
  Share2,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ProfilePage(){
    const user = useSelector((state) => state.auth.user);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      name: user?.user?.name || '',
      email: user?.user?.email || '',
      username: user?.user?.username || '',
      phone: user?.user?.phone || '',
      bio: user?.user?.bio || '',
      location: user?.user?.location || ''
    });

    console.log("User data in profile page:", user);    

    const handleEdit = () => {
      setEditData({
        name: user?.user?.name || '',
        email: user?.user?.email || '',
        username: user?.user?.username || '',
        phone: user?.user?.phone || '',
        bio: user?.user?.bio || '',
        location: user?.user?.location || ''
      });
      setIsEditing(true);
    };

    const handleSave = () => {
      // Here you would typically make an API call to update the user profile
      console.log("Saving profile data:", editData);
      setIsEditing(false);
    };

    const handleCancel = () => {
      setIsEditing(false);
      setEditData({
        name: user?.user?.name || '',
        email: user?.user?.email || '',
        username: user?.user?.username || '',
        phone: user?.user?.phone || '',
        bio: user?.user?.bio || '',
        location: user?.user?.location || ''
      });
    };

    const handleInputChange = (field, value) => {
      setEditData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const stats = [
      { label: "Services Booked", value: "24", icon: Award, color: "text-green-600" },
      { label: "Reviews Given", value: "18", icon: Star, color: "text-yellow-500" },
      { label: "Member Since", value: "2023", icon: Calendar, color: "text-blue-500" },
      { label: "Success Rate", value: "98%", icon: Shield, color: "text-emerald-600" }
    ];

    const recentActivity = [
      { action: "Booked cleaning service", time: "2 hours ago", type: "booking" },
      { action: "Left a 5-star review", time: "1 day ago", type: "review" },
      { action: "Updated profile picture", time: "3 days ago", type: "profile" },
      { action: "Completed KYC verification", time: "1 week ago", type: "verification" }
    ];

  return (
      <>
        <HeaderNavbar/>
        <div className="mt-16 min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="flex flex-col md:flex-row items-center gap-8">

               
                {/* Profile Picture */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                    <AvatarImage 
                      src={`${BASE_URL}${user?.user?.profile_picture}`} 
                      alt="Profile Picture" 
                    />
                    <AvatarFallback className="text-2xl font-bold bg-green-100 text-green-700">
                      {user?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 bg-white text-green-600 p-2 rounded-full shadow-lg hover:bg-green-50 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold mb-2">
                    {isEditing ? (
                      <Input
                        value={editData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="text-4xl font-bold bg-white/20 border-white/30 text-white placeholder-white/70"
                        placeholder="Your Name"
                      />
                    ) : (
                      user?.user?.name || 'User Name'
                    )}
                  </h1>
                  <p className="text-green-100 text-lg mb-4">
                    @{isEditing ? (
                      <Input
                        value={editData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="text-lg bg-white/20 border-white/30 text-white placeholder-white/70 w-48"
                        placeholder="username"
                      />
                    ) : (
                      user?.user?.username || 'username'
                    )}
                  </p>
                  <p className="text-green-100 mb-6 max-w-2xl">
                    {isEditing ? (
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="bg-white/20 border-white/30 text-white placeholder-white/70 resize-none"
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    ) : (
                      user?.user?.bio || "Welcome to your profile! Tell us about yourself to help others get to know you better."
                    )}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {isEditing ? (
                      <>
                        <Button 
                          onClick={handleSave}
                          className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button 
                          onClick={handleCancel}
                          variant="outline"
                          className="border-white text-white hover:bg-white/10 font-semibold px-6 py-2 rounded-xl"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          onClick={handleEdit}
                          className="bg-white text-green-600 hover:bg-green-50 font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-white text-white hover:bg-white/10 font-semibold px-6 py-2 rounded-xl"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Profile
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <User className="h-5 w-5" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 flex items-center gap-2 text-gray-900">
                            <Mail className="h-4 w-4 text-green-600" />
                            {user?.user?.email || 'Not provided'}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            type="tel"
                            value={editData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="mt-1"
                          />
                        ) : (
                          <div className="mt-1 flex items-center gap-2 text-gray-900">
                            <Phone className="h-4 w-4 text-green-600" />
                            {user?.user?.phone || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      {isEditing ? (
                        <Input
                          id="location"
                          value={editData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="mt-1"
                          placeholder="Enter your location"
                        />
                      ) : (
                        <div className="mt-1 flex items-center gap-2 text-gray-900">
                          <MapPin className="h-4 w-4 text-green-600" />
                          {user?.user?.location || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <Bell className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Quick Actions & Settings */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-700">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700 text-white">
                      <Heart className="h-4 w-4 mr-2" />
                      View Favorites
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                      <Settings className="h-4 w-4 mr-2" />
                      Account Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50">
                      <Download className="h-4 w-4 mr-2" />
                      Download Data
                    </Button>
                  </CardContent>
                </Card>

                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-700">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email Verified</span>
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">KYC Status</span>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profile Complete</span>
                      <Badge className="bg-green-100 text-green-800">85%</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Tips */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <p>• Keep your profile information up to date</p>
                    <p>• Use a strong, unique password</p>
                    <p>• Enable two-factor authentication</p>
                    <p>• Review your privacy settings regularly</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
    </div>
    </>
  );
}