import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/6819fc20-6871-4628-b2c6-75f859ab9b84';
const PASSWORD = 'eashop25';

interface Order {
  id: number;
  first_name: string;
  last_name?: string;
  phone?: string;
  telegram: string;
  uid: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    telegram: '',
    uid: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive'
      });
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      setIsAuthenticated(true);
    } else {
      toast({
        title: 'Ошибка',
        description: 'Неверный пароль',
        variant: 'destructive'
      });
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.telegram || !formData.uid) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    setShowCreateDialog(false);
    setProcessingMessage('Запрос обрабатывается...');
    setShowSuccessDialog(true);

    setTimeout(async () => {
      try {
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        setProcessingMessage('Заявка создана');
        
        setTimeout(() => {
          setShowSuccessDialog(false);
          setFormData({ first_name: '', last_name: '', phone: '', telegram: '', uid: '' });
          fetchOrders();
        }, 1500);
      } catch (error) {
        setShowSuccessDialog(false);
        toast({
          title: 'Ошибка',
          description: 'Не удалось создать заказ',
          variant: 'destructive'
        });
      }
    }, 2000);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      fetchOrders();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус',
        variant: 'destructive'
      });
    }
  };

  const getStatusButtons = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => updateOrderStatus(order.id, 'accepted')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
            >
              Принять
            </Button>
            <Button
              onClick={() => updateOrderStatus(order.id, 'rejected')}
              variant="outline"
              className="rounded-full px-6"
            >
              Отклонить
            </Button>
          </div>
        );
      case 'accepted':
        return (
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground">В обработке</span>
            <Button
              onClick={() => updateOrderStatus(order.id, 'cancelled')}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Отменили
            </Button>
            <Button
              onClick={() => updateOrderStatus(order.id, 'completed')}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
              size="sm"
            >
              Завершили
            </Button>
          </div>
        );
      case 'completed':
        return <span className="text-sm font-medium text-primary">Заказ выполнен</span>;
      case 'rejected':
        return <span className="text-sm text-destructive">Отклонён</span>;
      case 'cancelled':
        return <span className="text-sm text-muted-foreground">Отменён</span>;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-lg border-0 bg-card">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Lock" size={36} className="text-primary" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">Вход</h1>
              <p className="text-sm text-muted-foreground">Введите пароль для доступа</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl border-border"
                  placeholder="Введите пароль"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium"
              >
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Заказы</h1>
            <p className="text-muted-foreground mt-1">Управление заказами</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 h-11"
          >
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить
          </Button>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">
                      {order.first_name} {order.last_name || ''}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {order.phone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={14} />
                          {order.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Icon name="Send" size={14} />
                        {order.telegram}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={14} />
                        UID: {order.uid}
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <Icon name="Clock" size={12} />
                        {formatDateTime(order.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  {getStatusButtons(order)}
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="Package" size={36} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Пока нет заказов</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Новый заказ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="first_name" className="text-sm font-medium">
                Имя <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Введите имя"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-sm font-medium">Фамилия</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Введите фамилию"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Номер телефона</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
            <div>
              <Label htmlFor="telegram" className="text-sm font-medium">
                Telegram <span className="text-destructive">*</span>
              </Label>
              <Input
                id="telegram"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="@username"
                required
              />
            </div>
            <div>
              <Label htmlFor="uid" className="text-sm font-medium">
                UID аккаунта <span className="text-destructive">*</span>
              </Label>
              <Input
                id="uid"
                value={formData.uid}
                onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Введите UID"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium"
            >
              Создать
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <div className="py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Check" size={32} className="text-primary" />
            </div>
            <p className="text-xl font-semibold">{processingMessage}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
