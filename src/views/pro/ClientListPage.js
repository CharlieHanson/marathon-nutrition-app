// src/views/pro/ClientListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Users, Search, UserPlus, Calendar, Mail, ArrowRight } from 'lucide-react';
import { authenticatedFetch, getApiUrl } from '../../../shared/services/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { Badge } from '@/src/components/ui/badge';
import { Avatar, AvatarFallback } from '@/src/components/ui/avatar';
import { Skeleton } from '@/src/components/ui/skeleton';

// currentUser is passed from ClientsPage (AuthContext.user)
export const ClientListPage = ({ currentUser }) => {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('ClientListPage render', {
    loading,
    clientsLen: clients.length,
    filteredLen: filteredClients.length,
    path: router.asPath,
    hasUser: !!currentUser,
    userId: currentUser?.id,
  });

  const loadClients = useCallback(async () => {
    console.log('ClientListPage: loadClients START');
    setLoading(true);

    try {
      if (!currentUser) {
        console.warn('ClientListPage: no currentUser, clearing clients');
        setClients([]);
        setFilteredClients([]);
        return;
      }

      const userId = currentUser.id;

      console.log('ClientListPage: fetching via /api/pro/clients for', userId);
      const res = await authenticatedFetch(getApiUrl(`/api/pro/clients?userId=${encodeURIComponent(userId)}`));

      if (!res.ok) {
        console.error('ClientListPage: API /pro/clients not ok', res.status);
        setClients([]);
        setFilteredClients([]);
        return;
      }

      const json = await res.json();
      console.log('ClientListPage: API /pro/clients response', json);

      const clientsData = json.clients || [];
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (err) {
      console.error('ClientListPage: UNCAUGHT error in loadClients', err);
      setClients([]);
      setFilteredClients([]);
    } finally {
      console.log('ClientListPage: loadClients FINISH (setLoading(false))');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log(
      'ClientListPage useEffect: calling loadClients for path',
      router.asPath,
      'with currentUser',
      currentUser?.id
    );
    loadClients();
  }, [loadClients, router.asPath, currentUser?.id]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          client.name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewClient = (clientId) => {
    router.push(`/pro/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-28 rounded-lg shrink-0" />
        </div>
        <Skeleton className="h-14 w-full rounded-card" />
        <div className="rounded-card border border-border bg-card p-2 sm:p-4 space-y-3">
          <div className="hidden sm:grid grid-cols-5 gap-4 px-2 pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-2 py-3 border-t border-border first:border-t-0"
            >
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
              <Skeleton className="hidden md:block h-4 w-16" />
              <Skeleton className="hidden sm:block h-4 w-24" />
              <Skeleton className="hidden lg:block h-6 w-20 rounded-full" />
              <Skeleton className="h-9 w-16 rounded-xl shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- UI unchanged below ----
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
                Share your invite code with clients to get started. Once they
                connect, they'll appear here and you can manage their nutrition
                plans.
              </p>
            </div>
            <Button onClick={() => router.push('/pro/profile')} className="mt-4">
              View My Invite Code
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Search Bar */}
          <Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Client Table */}
          {filteredClients.length === 0 ? (
            <Card>
              <p className="text-center text-muted-foreground py-8">
                No clients found matching &quot;{searchQuery}&quot;
              </p>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Connected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() => handleViewClient(client.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary-100 text-primary font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {client.name}
                            </p>
                            {client.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.age && (
                            <p className="text-muted-foreground">Age: {client.age}</p>
                          )}
                          {client.goal && (
                            <p className="text-muted-foreground capitalize">
                              Goal: {client.goal.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(client.connected_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.has_macro_bounds ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
                            Bounds Set
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">
                            No Bounds
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
