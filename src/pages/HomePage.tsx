import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 flex items-center justify-center">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Library Attendance System
          </h1>
          <p className="text-xl text-gray-600">
            Choose your access level to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Check In */}
          <Link to="/check-in">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-green-500 text-white cursor-pointer">
              <CardHeader className="text-center">
                <LogIn size={48} className="mx-auto mb-2" />
                <CardTitle className="text-2xl">Check In</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg">Enter the library</p>
                <p className="text-sm opacity-90 mt-2">Scan your student ID to check in</p>
              </CardContent>
            </Card>
          </Link>

          {/* Check Out */}
          <Link to="/check-out">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-red-500 text-white cursor-pointer">
              <CardHeader className="text-center">
                <LogOut size={48} className="mx-auto mb-2" />
                <CardTitle className="text-2xl">Check Out</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg">Exit the library</p>
                <p className="text-sm opacity-90 mt-2">Scan your student ID to check out</p>
              </CardContent>
            </Card>
          </Link>

          {/* Admin */}
          <Link to="/admin">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-purple-500 text-white cursor-pointer">
              <CardHeader className="text-center">
                <Settings size={48} className="mx-auto mb-2" />
                <CardTitle className="text-2xl">Admin</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg">View dashboard</p>
                <p className="text-sm opacity-90 mt-2">Simple overview of library activity</p>
              </CardContent>
            </Card>
          </Link>

          {/* Library Staff */}
          <Link to="/staff">
            <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-blue-500 text-white cursor-pointer">
              <CardHeader className="text-center">
                <Users size={48} className="mx-auto mb-2" />
                <CardTitle className="text-2xl">Library Staff</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg">Manage system</p>
                <p className="text-sm opacity-90 mt-2">Add students, edit accounts, export reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-center mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">For Students:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Use "Check In" when entering the library</li>
                <li>• Use "Check Out" when leaving the library</li>
                <li>• Simply scan your student ID barcode</li>
                <li>• Ask library staff if you need help</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">For Staff:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Admin: View simple dashboard overview</li>
                <li>• Staff: Manage student accounts and reports</li>
                <li>• Export attendance data by day or month</li>
                <li>• Add and edit student information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;