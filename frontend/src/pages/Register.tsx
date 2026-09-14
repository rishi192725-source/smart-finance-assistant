
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(2),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await api.post('/auth/register', data);
      login(response.data.data.accessToken, response.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError('root', { message: err.response?.data?.message || 'Registration failed' });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold">Register</h2>
        {errors.root && <div className="text-red-500 mb-2">{errors.root.message}</div>}
        
        <div className="mb-4">
          <label className="block mb-1">First Name</label>
          <input {...register('firstName')} className="w-full border p-2 rounded" />
          {errors.firstName && <div className="text-red-500 text-sm">{errors.firstName.message}</div>}
        </div>

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

        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Register</button>
        <div className="mt-4 text-sm text-center">
          <Link to="/login" className="text-blue-500">Already have an account? Login</Link>
        </div>
      </form>
    </div>
  );
};
