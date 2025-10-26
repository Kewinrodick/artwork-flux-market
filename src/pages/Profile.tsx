import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Download, ExternalLink, FileText } from 'lucide-react';

interface Design {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  status: string;
  created_at: string;
  tags: string[];
}

interface Transaction {
  id: string;
  design_id: string;
  amount: number;
  created_at: string;
  status: string;
  legal_doc_url: string | null;
  designer_earnings: number;
  designs: Design;
  buyer_profile?: {
    name: string;
    email: string;
  };
  designer_profile?: {
    name: string;
    email: string;
  };
}

export default function Profile() {
  const { user, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [myDesigns, setMyDesigns] = useState<Design[]>([]);
  const [soldDesigns, setSoldDesigns] = useState<Transaction[]>([]);
  const [purchasedDesigns, setPurchasedDesigns] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      if (hasRole('designer')) {
        // Fetch designer's uploaded designs
        const { data: designs, error: designsError } = await supabase
          .from('designs')
          .select('*')
          .eq('designer_id', user!.id)
          .order('created_at', { ascending: false });

        if (designsError) throw designsError;
        setMyDesigns(designs || []);

        // Fetch sold designs
        const { data: sales, error: salesError } = await supabase
          .from('transactions')
          .select(`
            *,
            designs:design_id(*),
            buyer_profile:profiles!buyer_id(name, email)
          `)
          .eq('designer_id', user!.id)
          .order('created_at', { ascending: false });

        if (salesError) throw salesError;
        setSoldDesigns(sales as any || []);
      }

      if (hasRole('buyer')) {
        // Fetch purchased designs
        const { data: purchases, error: purchasesError } = await supabase
          .from('transactions')
          .select(`
            *,
            designs:design_id(*),
            designer_profile:profiles!designer_id(name, email)
          `)
          .eq('buyer_id', user!.id)
          .order('created_at', { ascending: false });

        if (purchasesError) throw purchasesError;
        setPurchasedDesigns(purchases as any || []);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <Tabs defaultValue={hasRole('designer') ? 'designs' : 'purchases'}>
            <TabsList>
              {hasRole('designer') && (
                <>
                  <TabsTrigger value="designs">My Designs</TabsTrigger>
                  <TabsTrigger value="sold">Sold Designs</TabsTrigger>
                </>
              )}
              {hasRole('buyer') && (
                <TabsTrigger value="purchases">Purchased Designs</TabsTrigger>
              )}
            </TabsList>

            {hasRole('designer') && (
              <>
                <TabsContent value="designs" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">My Designs ({myDesigns.length})</h2>
                    <Button asChild>
                      <Link to="/upload-design">Upload New Design</Link>
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {myDesigns.map((design) => (
                      <Card key={design.id} className="overflow-hidden">
                        <Link to={`/design/${design.id}`}>
                          <img
                            src={design.image_url}
                            alt={design.title}
                            className="w-full aspect-square object-cover hover:scale-105 transition-transform"
                          />
                        </Link>
                        <CardHeader>
                          <CardTitle className="flex justify-between items-start">
                            <span>{design.title}</span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              design.status === 'sold' 
                                ? 'bg-destructive text-destructive-foreground' 
                                : 'bg-primary text-primary-foreground'
                            }`}>
                              {design.status}
                            </span>
                          </CardTitle>
                          <CardDescription>${design.price}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sold" className="space-y-4">
                  <h2 className="text-2xl font-bold">Sold Designs ({soldDesigns.length})</h2>
                  <div className="space-y-4">
                    {soldDesigns.map((transaction) => (
                      <Card key={transaction.id}>
                        <CardContent className="p-6">
                          <div className="flex gap-4">
                            <img
                              src={transaction.designs.image_url}
                              alt={transaction.designs.title}
                              className="w-24 h-24 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h3 className="font-bold text-lg">{transaction.designs.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Buyer: {transaction.buyer_profile?.name || transaction.buyer_profile?.email || 'Unknown'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Date: {new Date(transaction.created_at).toLocaleDateString()}
                              </p>
                              <p className="font-semibold mt-2">
                                Your Earnings: ${transaction.designer_earnings}
                              </p>
                            </div>
                            {transaction.legal_doc_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={transaction.legal_doc_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Legal Doc
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}

            {hasRole('buyer') && (
              <TabsContent value="purchases" className="space-y-4">
                <h2 className="text-2xl font-bold">Purchased Designs ({purchasedDesigns.length})</h2>
                <div className="space-y-4">
                  {purchasedDesigns.map((transaction) => (
                    <Card key={transaction.id}>
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <img
                            src={transaction.designs.image_url}
                            alt={transaction.designs.title}
                            className="w-24 h-24 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{transaction.designs.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Designer: {transaction.designer_profile?.name || transaction.designer_profile?.email || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                            <p className="font-semibold mt-2">Paid: ${transaction.amount}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="default" size="sm" asChild>
                              <a href={transaction.designs.image_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                            {transaction.legal_doc_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={transaction.legal_doc_url} target="_blank" rel="noopener noreferrer">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Legal Doc
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
