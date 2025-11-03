import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const PASSWORD = 'eashop25';
const STORAGE_KEY = 'orders_data';

interface Order {
  id: number;
  first_name: string;
  last_name?: string;
  phone?: string;
  telegram: string;
  uid: string;
  service_description?: string;
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
    uid: '',
    service_description: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setOrders(JSON.parse(stored));
    }
  };

  const saveOrders = (newOrders: Order[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    setOrders(newOrders);
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

    setTimeout(() => {
      const newOrder: Order = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      saveOrders([...orders, newOrder]);
      setProcessingMessage('Заявка создана');
      
      setTimeout(() => {
        setShowSuccessDialog(false);
        setFormData({ first_name: '', last_name: '', phone: '', telegram: '', uid: '', service_description: '' });
      }, 1500);
    }, 2000);
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
        : order
    );
    saveOrders(updatedOrders);
  };

  const deleteOrder = (orderId: number) => {
    const updatedOrders = orders.filter(order => order.id !== orderId);
    saveOrders(updatedOrders);
    toast({
      title: 'Успешно',
      description: 'Заказ удалён'
    });
  };

  const exportOrders = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Успешно',
      description: 'Заказы экспортированы'
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedOrders = JSON.parse(event.target?.result as string);
        saveOrders(importedOrders);
        toast({
          title: 'Успешно',
          description: `Импортировано ${importedOrders.length} заказов`
        });
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось импортировать файл',
          variant: 'destructive'
        });
      }
    };
    reader.readAsText(file);
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
          <div className="flex gap-2">
            <Button
              onClick={exportOrders}
              variant="outline"
              className="rounded-full"
            >
              <Icon name="Download" size={18} className="mr-2" />
              Экспорт
            </Button>
            <Button
              onClick={() => document.getElementById('import-file')?.click()}
              variant="outline"
              className="rounded-full"
            >
              <Icon name="Upload" size={18} className="mr-2" />
              Импорт
            </Button>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Icon name="Package" size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Нет заказов</h3>
            <p className="text-muted-foreground mb-6">Создайте первый заказ</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              Создать заказ
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {order.first_name} {order.last_name}
                      </h3>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </div>
                    </div>
                    <Button
                      onClick={() => deleteOrder(order.id)}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Icon name="Trash2" size={18} />
                    </Button>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {order.service_description && (
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Briefcase" size={14} />
                        <span className="font-medium text-foreground">{order.service_description}</span>
                      </div>
                    )}
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
                  </div>

                  <div className="pt-4 border-t border-border mt-4">
                    {getStatusButtons(order)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Новый заказ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4 mt-4">
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
              <Label htmlFor="last_name" className="text-sm font-medium">
                Фамилия
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Введите фамилию"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Телефон
              </Label>
              <Input
                id="phone"
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
            <div>
              <Label htmlFor="service_description" className="text-sm font-medium">
                Оказание услуги
              </Label>
              <Input
                id="service_description"
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                className="mt-1.5 h-12 rounded-xl"
                placeholder="Описание услуги"
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
        <DialogContent className="sm:max-w-sm">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {processingMessage === 'Запрос обрабатывается...' ? (
                <Icon name="Loader2" size={32} className="text-primary animate-spin" />
              ) : (
                <Icon name="Check" size={32} className="text-primary" />
              )}
            </div>
            <p className="text-lg font-medium">{processingMessage}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
