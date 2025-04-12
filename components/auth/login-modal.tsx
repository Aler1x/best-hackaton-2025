"use client"
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircleIcon, LogIn, LogOut, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { AlertDescription } from '../ui/alert'
import { AlertTitle } from '../ui/alert'
import { Alert } from '../ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function LoginModal() {
  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [role, setRole] = useState('volunteer')

  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) throw error
      setOpen(false)
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate password match
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (authError) throw authError
      
      if (authData.user) {
        // 2. Create or update user with selected role
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', authData.user.id)
        
        if (!existingUser || existingUser.length === 0) {
          // User doesn't exist, create new record
          const { error: insertError } = await supabase
            .from('users')
            .insert({ 
              id: authData.user.id,
              role: role
            })
          
          if (insertError) throw insertError
        } else {
          // User exists, update role
          const { error: updateError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', authData.user.id)
          
          if (updateError) throw updateError
        }
        
        // Wait to ensure the users record is fully created
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 3. Create corresponding record in either shelters or volunteers table
        if (role === 'shelter') {
          const { error: shelterError } = await supabase
            .from('shelters')
            .insert({ 
              id: authData.user.id,
              name: registerEmail.split('@')[0] || 'New Shelter', // Use part of email as initial name
            })
          
          if (shelterError) throw shelterError
        } else if (role === 'volunteer') {
          const { error: volunteerError } = await supabase
            .from('volunteers')
            .insert({ 
              id: authData.user.id,
            })
          
          if (volunteerError) throw volunteerError
        }
      }

      setOpen(false)
    } catch (error: any) {
      setError(error.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      // If we're on the register tab, we'll pass the role as a parameter
      const activeTab = document.querySelector('[data-state="active"][data-radix-tabs-trigger]')?.getAttribute('value')
      const isRegistering = activeTab === 'register'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${isRegistering ? `?role=${role}` : ''}`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const resetForm = () => {
    setLoginEmail('')
    setLoginPassword('')
    setRegisterEmail('')
    setRegisterPassword('')
    setRegisterConfirmPassword('')
    setRole('volunteer')
    setError(null)
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/account">
          <Button className="flex items-center gap-2" variant="neutral">
            <UserCircle className="h-4 w-4" />
            My Account
          </Button>
        </Link>
        <Button size="icon" variant="neutral" onClick={signOut} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" variant="neutral">
          <LogIn className="h-4 w-4" />
          Login
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Best Shelter</DialogTitle>
          <DialogDescription>
            Sign in or create an account to access all features.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Something went wrong!</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Button
              type="button"
              variant="default"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full mb-4"
            >
              Sign in with Google
            </Button>

            <form onSubmit={handleEmailLogin} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <DialogFooter className="mt-4 flex flex-col gap-2">
                <Button type="submit" disabled={loading} variant="neutral">
                  {loading ? 'Signing in...' : 'Sign in with Email'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <Button
              type="button"
              variant="default"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full mb-4"
            >
              Sign up with Google
            </Button>
            
            <form onSubmit={handleEmailRegister} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Account Type</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="volunteer" id="volunteer" />
                    <Label htmlFor="volunteer">Volunteer</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shelter" id="shelter" />
                    <Label htmlFor="shelter">Shelter</Label>
                  </div>
                </RadioGroup>
              </div>

              <DialogFooter className="mt-4 flex flex-col gap-2">
                <Button type="submit" disabled={loading} variant="neutral">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 