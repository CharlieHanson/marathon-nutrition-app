import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Users, Search, UserPlus, Calendar, Mail, ArrowRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export const ClientListPage = () => {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    // Filter clients based on search query
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get nutritionist's id from nutritionists table
      const { data: nutritionist, error: nutError } = await supabase
        .from('nutritionists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (nutError) throw nutError;

      // Get all client connections for this nutritionist
      const { data: connections, error: connError } = await supabase
        .from('client_nutritionist')
        .select(`
          client_user_id,
          created_at,
          kcal_min,
          kcal_max,
          protein_min,
          protein_max
        `)
        .eq('nutritionist_id', nutritionist.id)
        .order('created_at', { ascending: false });

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setClients([]);
        setFilteredClients([]);
        setLoading(false);
        return;
      }

      // Fetch profile data for each client
      const clientIds = connections.map(c => c.client_user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', clientIds);

      if (profileError) throw profileError;

      // Fetch user_profiles for additional info
      const { data: userProfiles, error: upError } = await supabase
        .from('user_profiles')
        .select('user_id, age, goal')
        .in('user_id', clientIds);

      if (upError) throw upError;

      // Fetch auth users for email (requires service role or RPC)
      // For now, we'll skip email unless you have a way to get it

      // Combine data
      const clientsData = connections.map(conn => {
        const profile = profiles.find(p => p.id === conn.client_user_id);
        const userProfile = userProfiles.find(up => up.user_id === conn.client_user_id);
        
        return {
          id: conn.client_user_id,
          name: profile?.name || 'Unknown Client',
          email: null, // We'll add this later if needed
          age: userProfile?.age,
          goal: userProfile?.goal,
          connected_at: conn.created_at,
          has_macro_bounds: !!(conn.kcal_min && conn.kcal_max),
        };
      });

      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleViewClient = (clientId) => {
    router.push(`/pro/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Clients</h1>
          <p className="text-gray-600 mt-2">
            Manage your connected clients and their nutrition plans
          </p>
        </div>
        {clients.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">
              {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {clients.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No clients yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Share your invite code with clients to get started. Once they connect, 
                they'll appear here and you can manage their nutrition plans.
              </p>
            </div>
            <Button
              onClick={() => router.push('/pro/profile')}
              className="mt-4"
            >
              View My Invite Code
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </Card>

          {/* Client Table */}
          {filteredClients.length === 0 ? (
            <Card>
              <p className="text-center text-gray-600 py-8">
                No clients found matching "{searchQuery}"
              </p>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Client Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Details
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Connected
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr 
                        key={client.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleViewClient(client.id)}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{client.name}</p>
                              {client.email && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            {client.age && (
                              <p className="text-gray-600">Age: {client.age}</p>
                            )}
                            {client.goal && (
                              <p className="text-gray-600 capitalize">
                                Goal: {client.goal.replace('_', ' ')}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {formatDate(client.connected_at)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {client.has_macro_bounds ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Bounds Set
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              No Bounds
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClient(client.id);
                            }}
                            icon={ArrowRight}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};