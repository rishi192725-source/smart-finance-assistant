
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await api.post('/auth/login', data);
      login(response.data.data.accessToken, response.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError('root', { message: err.response?.data?.message || 'Login failed' });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">Login</h2>
        {errors.root && <div className="text-red-500 mb-2">{errors.root.message}</div>}
        
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input {...register('email')} className="w-full border p-2 rounded" />
          {errors.email && <div className="text-red-500 text-sm">{errors.email.message}</div>}
        </div>

        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input type="password" {...register('password')} className="w-full border p-2 rounded" />
          {errors.password && <div className="text-red-500 text-sm">{errors.password.message}</div>}
        </div>

        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
        <div className="mt-4 text-sm text-center">
          <Link to="/register" className="text-blue-500">Don't have an account? Register</Link>
        </div>
      </form>
    </div>
  );
};
