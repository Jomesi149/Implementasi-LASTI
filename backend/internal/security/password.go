package security

import "golang.org/x/crypto/bcrypt"

// PasswordHasher abstracts password hashing implementations.
type PasswordHasher interface {
	Hash(plain string) (string, error)
	Compare(hash string, plain string) error
}

// BcryptHasher uses bcrypt with a configurable cost.
type BcryptHasher struct {
	cost int
}

// NewBcryptHasher creates a new PasswordHasher instance.
func NewBcryptHasher(cost int) *BcryptHasher {
	if cost == 0 {
		cost = bcrypt.DefaultCost
	}
	return &BcryptHasher{cost: cost}
}

// Hash produces the bcrypt hash for the supplied plaintext.
func (b *BcryptHasher) Hash(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), b.cost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// Compare validates a plaintext password against the stored hash.
func (b *BcryptHasher) Compare(hash string, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
