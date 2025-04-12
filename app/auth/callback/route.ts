import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'
  // Default role for new users (can be customized via query param in the future if needed)
  const role = searchParams.get('role') ?? 'volunteer'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      try {
        // Check if this is a new user by looking for their record in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          
        // If no user data or there's an error, create a new user
        if (!userData || userData.length === 0 || userError) {
          console.log('Creating new user record for', data.user.id)
          // User doesn't exist in our users table yet, create entry with default role
          const { error: insertError } = await supabase
            .from('users')
            .insert({ 
              id: data.user.id,
              role: role
            })
            
          if (insertError) {
            console.error('Error creating user record:', insertError)
          } else {
            // Wait a moment to ensure the users record is fully created
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Also create record in the appropriate role-specific table
            if (role === 'shelter') {
              const { error: shelterError } = await supabase
                .from('shelters')
                .insert({ 
                  id: data.user.id,
                  name: data.user.email?.split('@')[0] || 'New Shelter', // Use part of email as initial name
                })
              
              if (shelterError) {
                console.error('Error creating shelter record:', shelterError)
              }
            } else if (role === 'volunteer') {
              const { error: volunteerError } = await supabase
                .from('volunteers')
                .insert({ 
                  id: data.user.id,
                })
              
              if (volunteerError) {
                console.error('Error creating volunteer record:', volunteerError)
              }
            }
          }
        }
      } catch (err) {
        console.error('Error in user role setup:', err)
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
